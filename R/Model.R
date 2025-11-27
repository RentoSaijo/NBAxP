# Load library.
library(tidyverse)

# Load data.
twos <- read_csv(
  'data/twos_20222023_20252026_cleaned.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))
threes <- read_csv(
  'data/threes_20222023_20252026_cleaned.csv',
  col_types      = cols(.default = col_character()),
  na             = c('', 'NA', 'null'),
  show_col_types = FALSE
) %>% 
  mutate(across(
    where(is.character),
    ~ parse_guess(.x, na = c('', 'NA', 'null'))
  ))

# Split data.
twos_train   <- twos %>% 
  filter(!(as.integer(gid) %/% 1e5 == 225))
twos_test    <- twos %>% 
  filter(as.integer(gid) %/% 1e5 == 225)
threes_train <- threes %>% 
  filter(!(as.integer(gid) %/% 1e5 == 225))
threes_test  <- threes %>% 
  filter(as.integer(gid) %/% 1e5 == 225)
rm(twos, threes)

# Fit data.
twos_xP    <- glm(
  made ~ 
    distance + 
    subType + 
    descriptor + 
    isFromTurnOver + 
    isSecondChance + 
    isFastBreak,
  data   = twos_train,
  family = 'binomial'
)
threes_xP <- glm(
  made ~ 
    distance + 
    descriptor + 
    isFastBreak,
  data   = threes_train,
  family = 'binomial'
)
rm(twos_train, threes_train)

# Summarize models.
summary(twos_xP)
summary(threes_xP)

# Predict xP.
twos_predicted   <- twos_test %>% 
  mutate(
    xP = 2 * predict(
      twos_xP,
      newdata = .,
      type    = 'response'
    )
  )
threes_predicted <- threes_test %>% 
  mutate(
    xP = 3 * predict(
      threes_xP,
      newdata = .,
      type    = 'response'
    )
  )
rm(twos_test, threes_test, twos_xP, threes_xP)

# Write to CSV.
write_csv(twos_predicted, 'data/twos_20222023_20252026_predicted.csv')
write_csv(threes_predicted, 'data/threes_20222023_20252026_predicted.csv')
