# Load libraries.
library(tidyverse)

# Load data.
twos <- read_csv(
  'data/twos_20222023_20242025.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))
threes <- read_csv(
  'data/threes_20222023_20242025.csv',
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
  
  # Extract input columns
  x    <- as.numeric(df[[x_col]])
  y    <- as.numeric(df[[y_col]])
  side <- tolower(df[[side_col]])
  
  # 1) Convert 0–100 coords to feet
  x_ft <- x * 94 / 100
  y_ft <- y * 50 / 100
  df$x_ft <- x_ft
  df$y_ft <- y_ft
  
  # 2) Court-centered coords: (0,0) at center court
  df$x_center_ft <- x_ft - 94 / 2
  df$y_center_ft <- y_ft - 50 / 2
  
  # 3) Normalize so everyone attacks +x
  sign <- ifelse(side == 'left', -1, 1)
  df$x_att_ft <- df$x_center_ft * sign
  df$y_att_ft <- df$y_center_ft
  
  # 4) Distance & angle (hoop at origin, +x toward center court)
  hoop_x_left  <- 5.25
  hoop_x_right <- 94 - 5.25
  hoop_y       <- 25
  x_rel_left  <- x_ft - hoop_x_left
  x_rel_right <- hoop_x_right - x_ft
  x_rel       <- ifelse(side == 'left', x_rel_left, x_rel_right)
  y_rel       <- y_ft - hoop_y
  df$shot_distance_ft <- sqrt(x_rel^2 + y_rel^2)
  df$shot_angle_deg   <- atan2(y_rel, x_rel) * 180 / pi
  df
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
    -x_ft, 
    -y_ft, 
    -x_center_ft, 
    -y_center_ft, 
    -x_att_ft, 
    -y_att_ft, 
    -shot_distance_ft,
    -shot_angle_deg
  )
