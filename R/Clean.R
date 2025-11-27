# Load libraries.
library(tidyverse)

# Load data.
twos <- read_csv(
  'data/twos_20222023_20252026.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))
threes <- read_csv(
  'data/threes_20222023_20252026.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))

# Define helpers.
calculate_geometry <- function(
    df, 
    x_col = 'x', 
    y_col = 'y', 
    side_col = 'side'
) {
  # Extract columns.
  x    <- as.numeric(df[[x_col]])
  y    <- as.numeric(df[[y_col]])
  side <- tolower(df[[side_col]])
  
  # Convert coordinates.
  x_ft <- x * 94 / 100
  y_ft <- y * 50 / 100
  df$x_ft <- x_ft
  df$y_ft <- y_ft
  
  # Center coordinates.
  df$x_center_ft <- x_ft - 94 / 2
  df$y_center_ft <- y_ft - 50 / 2
  
  # Normalize by attacker side.
  sign_att <- ifelse(side == 'left', -1, 1)
  df$x_att_ft <- df$x_center_ft * sign_att
  df$y_att_ft <- df$y_center_ft * sign_att
  
  # Calculate shot distance and angle.
  hoop_x_att <- 47 - 5.25
  hoop_y_att <- 0
  dx <- df$x_att_ft - hoop_x_att
  dy <- df$y_att_ft - hoop_y_att
  df$shot_distance_ft <- sqrt(dx^2 + dy^2)
  df$shot_angle_deg   <- atan2(dy, dx) * 180 / pi
  df
}
clean_shots <- function(df) {
  df %>% 
    # Convert all is___ logicals to 0/1.
    mutate(
      across(starts_with('is'), ~ as.integer(.)),
      # Create numeric column for response.
      made = if_else(shotResult == 'Made', 1L, 0L)
    ) %>% 
    # Drop original.
    select(-shotResult)
}

# Add shot distance and angle.
twos   <- calculate_geometry(twos) %>% 
  mutate(
    x        = x_att_ft,
    y        = y_att_ft,
    distance = shot_distance_ft,
    angle    = shot_angle_deg
  ) %>% 
  select(
    -side,
    -x_ft, 
    -y_ft, 
    -x_center_ft, 
    -y_center_ft, 
    -x_att_ft, 
    -y_att_ft, 
    -shot_distance_ft,
    -shot_angle_deg
  )
threes <- calculate_geometry(threes) %>% 
  mutate(
    x        = x_att_ft,
    y        = y_att_ft,
    distance = shot_distance_ft,
    angle    = shot_angle_deg
  ) %>% 
  select(
    -side,
    -x_ft, 
    -y_ft, 
    -x_center_ft, 
    -y_center_ft, 
    -x_att_ft, 
    -y_att_ft, 
    -shot_distance_ft,
    -shot_angle_deg
  ) %>% 
  filter(x >= 0)

# Turn booleans to numeric.
twos   <- clean_shots(twos)
threes <- clean_shots(threes)

# Add sub-types.
twos$subType[twos$subType == 'shot']     <- 'Jump Shot'
threes$subType[threes$subType == 'shot'] <- 'Jump Shot'

# Add descriptions.
twos$descriptor[is.na(twos$descriptor)]     <- 'regular'
threes$descriptor[is.na(threes$descriptor)] <- 'regular'

# Write to CSV.
write_csv(twos, 'data/twos_20222023_20252026_claned.csv')
write_csv(threes, 'data/threes_20222023_20252026.csv_cleaned')
