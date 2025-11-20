nba_pbp <- function(id, query = list()) {
  base <- 'https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_0022400247.json'
  req <- httr2::request(base)
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
