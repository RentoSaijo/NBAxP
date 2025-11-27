# Load libraries.
library(tidyverse)
library(jsonlite)
library(httr2)

# Define helpers.
get_season_game_ids <- function(year) {
  url <- paste0(
    'https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/',
    year,
    '/league/00_full_schedule.json'
  )
  resp <- request(url) |> req_perform()
  dat  <- fromJSON(
    resp_body_string(resp, encoding = 'UTF-8'),
    simplifyVector = FALSE
  )
  lscd <- dat$lscd
  ids  <- unlist(
    lapply(lscd, function(month) {
      games <- month$mscd$g
      if (is.null(games) || length(games) == 0) return(character(0))
      vapply(games, `[[`, character(1), 'gid')
    }),
    use.names = FALSE
  )
  unique(ids)
}

nba_headers <- list(
  'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Accept'          = 'application/json, text/plain, */*',
  'Accept-Language' = 'en-US,en;q=0.9',
  'Origin'          = 'https://www.nba.com',
  'Referer'         = 'https://www.nba.com/',
  'Connection'      = 'keep-alive'
)

get_pbp_one <- function(gid) {
  url <- sprintf(
    'https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_%s.json',
    gid
  )
  
  resp <- request(url) |>
    req_headers(!!!nba_headers) |>
    req_error(is_error = ~ FALSE) |>
    req_perform()
  
  status <- resp_status(resp)
  if (status >= 400) {
    message('Skipping ', gid, ' (status ', status, ')')
    return(tibble())
  }
  
  dat <- fromJSON(
    resp_body_string(resp, encoding = 'UTF-8'),
    simplifyVector = TRUE,
    flatten        = TRUE
  )
  
  actions <- dat$game$actions
  if (is.null(actions) || nrow(actions) == 0) {
    message('No actions for ', gid)
    return(tibble())
  }
  
  as_tibble(actions) |>
    mutate(gid = gid, .before = 1)
}

get_pbp_one_slow <- function(gid) {
  out <- get_pbp_one(gid)
  Sys.sleep(0.2)
  out
}

get_standings <- function(query = list()) {
  req <- httr2::request(paste0(
    'https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2025/',
    '00_standings.json'
  ))
  req <- do.call(httr2::req_url_query, c(list(req), query))
  req <- httr2::req_retry(
    req,
    max_tries    = 3,
    backoff      = function(attempt) 2 ^ (attempt - 1),
    is_transient = function(resp) httr2::resp_status(resp) == 429
  )
  resp <- httr2::req_perform(req)
  jsonlite::fromJSON(
    httr2::resp_body_string(resp, encoding = 'UTF-8'),
    simplifyVector = TRUE,
    flatten        = TRUE
  )
}

# Get all the games from the 2022-23 season to the 2025-26 season.
years            <- 2022:2025
game_ids_by_year <- setNames(
  lapply(years, get_season_game_ids),
  years
)
games <- data.frame(
  gid = unique(unlist(game_ids_by_year, use.names = FALSE))
)
rm(game_ids_by_year, years, get_season_game_ids)

# Keep only regular season and playoff games.
games <- games %>% 
  filter(substring(gid, 1, 3) %in% c('002', '004'))

# Get all the pbps (~20 mins).
pbps <- games$gid |> purrr::map_dfr(get_pbp_one_slow)
rm(nba_headers, get_pbp_one, get_pbp_one_slow, games)

# Keep only relevant columns.
pbps <- pbps %>% 
  select(
    actionType, 
    gid, 
    actionNumber, 
    teamId,
    personId,
    x,
    y,
    side,
    subType, 
    descriptor,
    qualifiers,
    shotResult
  )

# Split by point types.
twos   <- pbps %>% 
  filter(actionType == '2pt') %>% 
  select(-actionType)
threes <- pbps %>% 
  filter(actionType == '3pt') %>% 
  select(-actionType)

# Flatten qualifiers.
qual_levels <- c(
  'pointsinthepaint',
  'fromturnover',
  '2ndchance',
  'fastbreak',
  'defensivegoaltending'
)
has_qual <- function(q) {
  vapply(twos$qualifiers, function(v) q %in% v, logical(1))
}
twos$isPointsInThePaint   <- has_qual('pointsinthepaint')
twos$isFromTurnOver       <- has_qual('fromturnover')
twos$isSecondChance       <- has_qual('2ndchance')
twos$isFastBreak          <- has_qual('fastbreak')
twos$isDefensiveGoaltend  <- has_qual('defensivegoaltending')
has_qual <- function(quals, q) {
  vapply(quals, function(v) q %in% v, logical(1))
}
threes$isPointsInThePaint  <- has_qual(threes$qualifiers, 'pointsinthepaint')
threes$isFromTurnOver      <- has_qual(threes$qualifiers, 'fromturnover')
threes$isSecondChance      <- has_qual(threes$qualifiers, '2ndchance')
threes$isFastBreak         <- has_qual(threes$qualifiers, 'fastbreak')
threes$isDefensiveGoaltend <- has_qual(threes$qualifiers, 'defensivegoaltending')
rm(has_qual, qual_levels)

# Eliminate unnecessary columns.
twos   <- twos %>% 
  select(-qualifiers, -isPointsInThePaint, -isDefensiveGoaltend)
threes <- threes %>% 
  select(-qualifiers, -isPointsInThePaint, -isDefensiveGoaltend)

# Write to CSV.
write_csv(twos, 'data/twos_20222023_20252026.csv')
write_csv(threes, 'data/threes_20222023_20252026.csv')

# Scrape teams.
standings <- get_standings()$sta$co %>% 
  filter(!(val == 'Intl'))
teams     <- standings$di %>%
  map_dfr(function(divisions_df) {
    map_dfr(divisions_df$t, function(team_df) {
      as_tibble(team_df) %>%
        select(tid, ta)
    })
  }) %>%
  distinct(tid, ta) %>%
  transmute(
    teamId   = as.integer(tid),
    teamCode = ta
  )
rm(standings, get_standings)

# Write to CSV.
write_csv(teams, 'data/teams_20252026.csv')
