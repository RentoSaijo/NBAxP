# Load library.
library(tidyverse)

# Load data.
twos <- read_csv(
  'data/twos_20252026_predicted.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))
threes <- read_csv(
  'data/threes_20252026_predicted.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))
teams  <- read_csv(
  'data/teams_20252026.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))

# Define helpers.
court_regions <- tibble::tibble(
  id = 1:14,
  poly = list(
    # 1: Left corner box
    matrix(c(
      -25, -4,
      -22, -4,
      -22, 10,
      -25, 10
    ), ncol = 2, byrow = TRUE),
    
    # 2: Right corner box
    matrix(c(
      22, -4,
      25, -4,
      25, 10,
      22, 10
    ), ncol = 2, byrow = TRUE),
    
    # 3: Left above corner
    matrix(c(
      -22, -4,
      -8,  -4,
      -8,  3.16,
      -22, 10
    ), ncol = 2, byrow = TRUE),
    
    # 4: Right above corner
    matrix(c(
      8,  -4,
      22, -4,
      22, 10,
      8,  3.16
    ), ncol = 2, byrow = TRUE),
    
    # 5: Lower paint
    matrix(c(
      -8, -4,
      8, -4,
      8,  5.5,
      -8,  5.5
    ), ncol = 2, byrow = TRUE),
    
    # 6: Upper paint
    matrix(c(
      -8,  5.5,
      8,  5.5,
      8, 15,
      -8, 15
    ), ncol = 2, byrow = TRUE),
    
    # 7: Left inside arc lower wing
    matrix(c(
      -22, 10,
      -8,  3.16,
      -8,  19,
      -14, 19
    ), ncol = 2, byrow = TRUE),
    
    # 8: Right inside arc lower wing
    matrix(c(
      8, 10,
      14, 10,
      14, 19,
      8, 19
    ), ncol = 2, byrow = TRUE),
    
    # 9: Left high elbow
    matrix(c(
      -6, 19,
      0, 19,
      0, 24,
      -6, 24
    ), ncol = 2, byrow = TRUE),
    
    # 10: Right high elbow
    matrix(c(
      0, 19,
      6, 19,
      6, 24,
      0, 24
    ), ncol = 2, byrow = TRUE),
    
    # 11: Left sideline deep
    matrix(c(
      -25.00, 10.00,
      -22.00, 10.00,
      -11.70, 22.42,
      -22.22, 43.00,
      -25.00, 43.00
    ), ncol = 2, byrow = TRUE),
    
    # 12: Right sideline deep
    matrix(c(
      22.00, 10.00,
      25.00, 10.00,
      25.00, 43.00,
      22.22, 43.00,
      11.70, 22.42
    ), ncol = 2, byrow = TRUE),
    
    # 13: Left-center deep three
    matrix(c(
      -11.75, 22.42,
      0.00, 24.00,
      0.00, 43.00,
      -22.22, 43.00
    ), ncol = 2, byrow = TRUE),
    
    # 14: Right-center deep three
    matrix(c(
      0.00, 24.00,
      11.75, 22.42,
      22.22, 43.00,
      0.00, 43.00
    ), ncol = 2, byrow = TRUE)
  )
)

point_in_poly <- function(x, y, poly, eps = 1e-9) {
  n <- nrow(poly)
  inside <- FALSE
  j <- n
  for (i in seq_len(n)) {
    xi <- poly[i, 1]; yi <- poly[i, 2]
    xj <- poly[j, 1]; yj <- poly[j, 2]
    cross <- (x - xi) * (yj - yi) - (y - yi) * (xj - xi)
    if (abs(cross) < eps &&
        x >= min(xi, xj) - eps && x <= max(xi, xj) + eps &&
        y >= min(yi, yj) - eps && y <= max(yi, yj) + eps) {
      return(TRUE)
    }
    intersect <- ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside <- !inside
    j <- i
  }
  inside
}

point_segment_dist <- function(px, py, x1, y1, x2, y2) {
  dx <- x2 - x1
  dy <- y2 - y1
  if (abs(dx) < 1e-9 && abs(dy) < 1e-9) {
    return(sqrt((px - x1)^2 + (py - y1)^2))
  }
  t <- ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  t <- max(0, min(1, t))
  projx <- x1 + t * dx
  projy <- y1 + t * dy
  sqrt((px - projx)^2 + (py - projy)^2)
}

point_poly_dist <- function(x, y, poly) {
  n <- nrow(poly)
  dmin <- Inf
  for (i in seq_len(n)) {
    j <- if (i < n) i + 1 else 1
    d <- point_segment_dist(x, y,
                            poly[i, 1], poly[i, 2],
                            poly[j, 1], poly[j, 2])
    if (d < dmin) dmin <- d
  }
  dmin
}

assign_region_from_Rcoords <- function(
  x_R, 
  y_R,
  regions = court_regions,
  fallback_radius = 3
) {
  if (is.na(x_R) || is.na(y_R)) return(NA_integer_)
  x_JS <- y_R
  y_JS <- 43 - x_R
  inside_flags <- vapply(
    regions$poly,
    point_in_poly,
    logical(1),
    x = x_JS,
    y = y_JS
  )
  idx <- which(inside_flags)
  if (length(idx) > 0) {
    return(regions$id[idx[1]])
  }
  in_half_court <- (x_R >= 0 && x_R <= 47 && y_R >= -25 && y_R <= 25)
  if (!in_half_court) return(NA_integer_)
  dists <- vapply(
    regions$poly,
    point_poly_dist,
    numeric(1),
    x = x_JS,
    y = y_JS
  )
  nearest <- which.min(dists)
  if (!is.infinite(dists[nearest]) && dists[nearest] <= fallback_radius) {
    return(regions$id[nearest])
  }
  NA_integer_
}

# Label regions.
twos   <- twos %>%
  mutate(
    region_id = map2_int(x, y, ~ assign_region_from_Rcoords(.x, .y))
  )
threes <- threes %>%
  mutate(
    region_id = map2_int(x, y, ~ assign_region_from_Rcoords(.x, .y))
  )
rm(
  court_regions, 
  assign_region_from_Rcoords, 
  point_in_poly, 
  point_poly_dist, 
  point_segment_dist
)

# Group by team and region.
shots       <- bind_rows(twos, threes) %>%
  left_join(teams, by = 'teamId')
all_regions <- tibble(region_id = 1:14)
all_teams   <- teams %>% distinct(teamCode)
region_team_grid <- expand_grid(
  region_id = all_regions$region_id,
  teamCode  = all_teams$teamCode
)
region_team_summary <- shots %>%
  filter(!is.na(region_id), !is.na(teamCode)) %>%
  group_by(region_id, teamCode) %>%
  summarise(
    Expected_Points     = sum(xP, na.rm = TRUE),
    Jump_Shots          = sum(subType == 'Jump Shot', na.rm = TRUE),
    Layups              = sum(subType == 'Layup',     na.rm = TRUE),
    Dunks               = sum(subType == 'DUNK',      na.rm = TRUE),
    Hooks               = sum(subType == 'Hook',      na.rm = TRUE),
    From_Turnovers      = sum(isFromTurnOver,  na.rm = TRUE),
    From_Second_Chances = sum(isSecondChance,  na.rm = TRUE),
    From_Fast_Break     = sum(isFastBreak,     na.rm = TRUE),
    Average_Distance    = mean(distance,       na.rm = TRUE),
    .groups = 'drop'
  )
sum_cols <- c(
  'Expected_Points', 'Jump_Shots', 'Layups', 'Dunks', 'Hooks',
  'From_Turnovers', 'From_Second_Chances', 'From_Fast_Break'
)
region_team_full <- region_team_grid %>%
  left_join(region_team_summary, by = c('region_id', 'teamCode')) %>%
  mutate(
    across(all_of(sum_cols), ~ replace_na(., 0))
  )
final <- region_team_full %>%
  mutate(Region = region_id) %>%
  select(
    Region, teamCode,
    Expected_Points, Jump_Shots, Layups, Dunks, Hooks,
    From_Turnovers, From_Second_Chances, From_Fast_Break
  ) %>%
  pivot_wider(
    id_cols    = Region,
    names_from = teamCode,
    values_from = c(
      Expected_Points, Jump_Shots, Layups, Dunks, Hooks,
      From_Turnovers, From_Second_Chances, From_Fast_Break
    ),
    names_glue = '{teamCode}_{.value}'
  ) %>%
  arrange(Region)
rm(
  all_regions, all_teams, region_team_full, region_team_grid, 
  region_team_summary, shots, threes, sum_cols
)

# Count number of games per team.
games_played <- twos %>%
  distinct(teamId, gid) %>%
  count(teamId, name = 'Games_Played')
teams <- teams %>%
  left_join(games_played, by = 'teamId') %>%
  mutate(Games_Played = replace_na(Games_Played, 0L))
rm(games_played, twos)

# Calculate pace for each statistic.
team_games <- teams %>%
  select(teamCode, Games_Played)
final_pace <- final %>%
  select(Region)
for (i in seq_len(nrow(team_games))) {
  tc <- team_games$teamCode[i]
  gp <- team_games$Games_Played[i]
  cols <- names(final)[str_starts(names(final), paste0(tc, '_'))]
  if (!length(cols)) next
  new_cols <- paste0(cols, '_Pace')
  if (gp > 0) {
    final_pace[new_cols] <- final[cols] / gp * 82
  } else {
    final_pace[new_cols] <- NA_real_
  }
}
rm(team_games, teams, cols, gp, i, new_cols, tc)

# Round all numerics.
final_pace_rounded <- round(final_pace)

# Write to CSV.
write_csv(final_pace_rounded, 'data/shots_region_team_pace_20252026.csv')
