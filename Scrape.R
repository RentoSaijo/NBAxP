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
get_pbp_one <- function(gid) {
  url <- sprintf(
    'https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_%s.json',
    gid
  )
  resp     <- request(url) |>
    req_error(is_error = ~ FALSE) |>
    req_perform()
  status   <- resp_status(resp)
  if (status >= 400) {
    message('Skipping ', gid, ' (status ', status, ')')
    return(tibble())
  }
  dat     <- fromJSON(
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

# Get all the games from the 2022-23 season to the 2024-25 season.
years            <- 2022:2024
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

# Get all the pbps.
pbps  <- games$gid |>
  map_dfr(get_pbp_one)
rm(get_pbp_one)
