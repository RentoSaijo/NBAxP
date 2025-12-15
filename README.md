# COM329 Final Project: Expected Points for the NBA

NBAxP is a D3 web application that visualizes NBA shot quality using a custom **Expected Points (xP)** model. The site draws the attacking half-court, divides it into **14 regions**, and changes each region’s **opacity** based on a team’s **expected points pace per 82 games** generated from that region. The purpose is to evaluate shot *quality* (team structure and chance creation) rather than shot *outcomes* (which are heavily influenced by shooting talent and variance).

### 1. What is an expected points (xP) model?

An **Expected Points (xP)** model assigns an expected point value to every shot attempt by estimating the probability that the shot is made given its context, then multiplying by the shot’s point value (2 or 3). Conceptually, it is analogous to an **expected goals (xG)** model in hockey: instead of letting makes/misses dominate the story, it estimates what an average shooter would be expected to score from the same shot conditions. This “de-lucks” the results and helps distinguish whether a team is consistently creating high-quality looks or relying on difficult shot-making.

In this project, the probability of a made shot is produced by **logistic regression**. Logistic regression models the log-odds of a make as a linear function of shot features, then converts that into a probability with the sigmoid function. For a shot with linear predictor \(\eta\), the make probability is:

\[
P(\text{made}) = \sigma(\eta) = \frac{1}{1 + e^{-\eta}}
\]

Expected points for an individual attempt are then computed as:

\[
xP_{2} = 2 \cdot P(\text{made}_{2}) \quad\text{and}\quad xP_{3} = 3 \cdot P(\text{made}_{3})
\]

Aggregating these values across thousands of shots produces an estimate of how many points a team would be expected to score (and where) based purely on shot quality and context.

### 2. Data Acquisition

All shots used in NBAxP are collected from public NBA JSON endpoints. Season schedules are downloaded for multiple years, and all game IDs are extracted from each season’s schedule. For each game ID, the play-by-play endpoint is queried and the full list of in-game “actions” is pulled. Requests include browser-like headers (origin/referer/user-agent) so that endpoints respond consistently, and the pipeline skips over games that return non-success status codes. The dataset is restricted to regular-season and playoff game IDs (prefixes `002` and `004`), and only shot actions are kept.

From each play-by-play action, the pipeline retains the identifying and spatial fields needed downstream—game ID, team ID, shooter, court coordinates, attacking side, shot subtype, descriptor text, qualifier tags, and whether the shot was made. Shots are then split into **2-point attempts** and **3-point attempts** based on the action type. Finally, team IDs and team abbreviations are scraped from the league standings endpoint and exported so that the web app can label team outputs consistently.

### 3. Data Wrangling

The wrangling stage standardizes types, cleans categorical fields, creates the target variable, and transforms coordinates into a consistent attacking-half-court reference frame. Raw shot coordinates are converted from the NBA feed’s 0–100 coordinate scale into feet by mapping the x-axis to court length (94 ft) and the y-axis to court width (50 ft). Coordinates are then centered around midcourt, and the `side` field is used to normalize direction so that all shots are represented as occurring on the same attacking half-court regardless of whether the original action was logged on the left or right. From these normalized coordinates, the pipeline computes each shot’s **distance to the hoop** in feet and also computes an angle in degrees (angle is retained for potential use and interpretability, although the current xP models primarily use distance plus categorical/context features).

The dataset is further cleaned by converting all `is...` context flags into numeric 0/1 form and by creating the modeling response variable `made`, where a made shot is coded as 1 and a miss is coded as 0. Shot taxonomy is standardized by recoding subtype values where `subType == "shot"` into `"Jump Shot"`, and any missing descriptors are filled with `"regular"` so that categorical handling is stable. The final cleaned outputs are written as season-spanning 2-point and 3-point shot tables with consistent columns and a normalized coordinate system.

### 4. Model Interpretation

NBAxP fits **two separate logistic regressions**, one for **2-point shots** and one for **3-point shots**, because the mechanisms and baselines of twos and threes differ enough that a single combined model would either require extra complexity or risk miscalibration. Each model predicts a shot’s make probability using a logit link (R’s `glm(..., family="binomial")`), and then converts that make probability into expected points by multiplying by 2 or 3. Both models include **shot distance** as a continuous feature; they also include categorical descriptors that capture shot style and circumstance, and the specification includes transition/possession flags where appropriate.

The training/test split is done by season prefix within the game ID (`gid`). Shots whose `gid` prefix matches the 2025–26 season (`as.integer(gid) %/% 1e5 == 225`) are treated as the “target” season for prediction, while all other seasons form the training set. This means the model learns relationships from prior seasons and then produces xP estimates for the season displayed on the site.

For **two-pointers**, the model includes distance, shot subtype, descriptor, and three context flags. The two-point linear predictor can be written as:

\[
\eta_{2} = \beta_0 + \beta_1\cdot\text{distance} + \beta(\text{subType}) + \beta(\text{descriptor}) + \beta_{TO}\cdot\text{isFromTurnOver} + \beta_{SC}\cdot\text{isSecondChance} + \beta_{FB}\cdot\text{isFastBreak}
\]

\[
P(\text{made}_{2}) = \frac{1}{1 + e^{-\eta_2}}, \qquad xP_{2} = 2\cdot P(\text{made}_{2})
\]

For **three-pointers**, the model includes distance, descriptor, and fast break context:

\[
\eta_{3} = \beta_0 + \beta_1\cdot\text{distance} + \beta(\text{descriptor}) + \beta_{FB}\cdot\text{isFastBreak}
\]

\[
P(\text{made}_{3}) = \frac{1}{1 + e^{-\eta_3}}, \qquad xP_{3} = 3\cdot P(\text{made}_{3})
\]

Because `subType` and `descriptor` are categorical, R’s GLM expands them into indicator variables with one omitted **reference level**; every listed coefficient should be interpreted as the effect on log-odds *relative to the reference category*, holding other variables constant. Practically, negative coefficients typically reflect more difficult shot types or circumstances (lower make probability), while positive coefficients reflect easier or more favorable contexts.

#### Two-point logistic regression (2PT) coefficients

| Variable | Coefficient (β) | p-value |
|---|---:|---:|
| Intercept | 2.369909 | < 2e-16 |
| distance | -0.072160 | < 2e-16 |
| subType: Hook | -1.502184 | < 2e-16 |
| subType: Jump Shot | -1.228805 | < 2e-16 |
| subType: Layup | -1.633853 | < 2e-16 |
| descriptor: bank | -0.256473 | 0.000231 |
| descriptor: cutting | 0.206284 | 4.07e-09 |
| descriptor: cutting finger roll | 0.780861 | < 2e-16 |
| descriptor: driving | -0.599709 | < 2e-16 |
| descriptor: driving bank | -0.432584 | 6.46e-15 |
| descriptor: driving finger roll | 0.032006 | 0.370016 |
| descriptor: driving floating | -0.822517 | < 2e-16 |
| descriptor: driving floating bank | -0.674017 | < 2e-16 |
| descriptor: driving reverse | -0.290599 | 4.30e-13 |
| descriptor: fadeaway | -0.668920 | < 2e-16 |
| descriptor: fadeaway bank | -0.436667 | 9.48e-07 |
| descriptor: finger roll | 0.112084 | 0.109134 |
| descriptor: floating | -0.656750 | < 2e-16 |
| descriptor: pullup | -0.299545 | 1.04e-14 |
| descriptor: pullup bank | -0.209601 | 0.001785 |
| descriptor: putback | 0.049521 | 0.207806 |
| descriptor: regular | -0.416927 | < 2e-16 |
| descriptor: reverse | 0.066979 | 0.150379 |
| descriptor: running | -0.420871 | < 2e-16 |
| descriptor: running alley-oop | -0.187843 | 0.010328 |
| descriptor: running finger roll | 0.204121 | 8.63e-05 |
| descriptor: running pullup | -0.525428 | 7.01e-15 |
| descriptor: running reverse | -0.169663 | 0.006939 |
| descriptor: step back | -0.179420 | 1.64e-05 |
| descriptor: step back bank | 0.291629 | 0.099127 |
| descriptor: tip | -0.721666 | < 2e-16 |
| descriptor: turnaround | -0.567517 | < 2e-16 |
| descriptor: turnaround bank | -0.164754 | 0.007877 |
| descriptor: turnaround fadeaway | -0.572889 | < 2e-16 |
| descriptor: turnaround fadeaway bank | -0.154780 | 0.189546 |
| isFromTurnOver | 0.046443 | 1.42e-06 |
| isSecondChance | -0.051248 | 0.000105 |
| isFastBreak | 0.288597 | < 2e-16 |

The 2PT model shows a strong and intuitive distance penalty, indicating that even within the two-point range, added distance reduces make probability. The categorical terms further adjust for shot styles that tend to be more or less difficult given the same distance, while the possession-context flags quantify how the environment changes shot quality. For example, fast breaks are associated with higher make probability (more space and fewer set defenders), while certain shot descriptors commonly tied to off-balance or heavily contested attempts reduce make probability relative to the reference category.

#### Three-point logistic regression (3PT) coefficients

| Variable | Coefficient (β) | p-value |
|---|---:|---:|
| Intercept | 0.789630 | 4.88e-14 |
| distance | -0.043250 | < 2e-16 |
| descriptor: driving bank | 0.441245 | 0.756346 |
| descriptor: driving floating | -1.140638 | 0.000306 |
| descriptor: driving floating bank | -0.506012 | 0.340338 |
| descriptor: fadeaway | -0.837567 | 1.38e-11 |
| descriptor: fadeaway bank | -0.427366 | 0.359367 |
| descriptor: floating | -1.327731 | 1.42e-07 |
| descriptor: pullup | -0.329872 | 0.000185 |
| descriptor: pullup bank | 0.037263 | 0.792048 |
| descriptor: regular | -0.232456 | 0.008090 |
| descriptor: running | -0.334536 | 0.000456 |
| descriptor: running pullup | -0.369949 | 0.000135 |
| descriptor: step back | -0.309641 | 0.000479 |
| descriptor: step back bank | 0.403853 | 0.047873 |
| descriptor: turnaround | -0.734781 | 2.98e-06 |
| descriptor: turnaround bank | 0.102973 | 0.850904 |
| descriptor: turnaround fadeaway | -1.068131 | 5.53e-05 |
| descriptor: turnaround fadeaway bank | -0.324796 | 0.709181 |
| isFastBreak | 0.190008 | 7.19e-08 |

The 3PT model again shows a clear distance penalty and then adjusts make probability based on how the attempt was taken. Many descriptors associated with self-created, off-balance, or heavily pressured threes (pullups, step-backs, turnarounds, fadeaways) tend to reduce make probability relative to the reference descriptor, while fast-break threes are associated with higher make probability, consistent with transition shots often being cleaner and less contested.

### 5. Model Predictions

Once both logistic regressions are fit on the training seasons, the 2025–26 test-season shots receive **shot-level predictions**. For each two-point attempt, the model produces \(P(\text{made}_2)\) and the pipeline stores \(xP_2 = 2\cdot P(\text{made}_2)\); for each three-point attempt, it stores \(xP_3 = 3\cdot P(\text{made}_3)\). These predicted shot-level xP values are the building blocks for every visualization element on the site, because they allow the app to compare teams and regions using expected scoring value rather than makes/misses.

To connect shot-level xP to a floor map, every predicted shot is assigned to one of **14 predefined half-court regions**. Region membership is determined by point-in-polygon checks against fixed region polygons defined in the same coordinate space as the D3 court drawing. Because the modeling data uses an “R-style” attacking coordinate system where \(x\) increases toward the hoop and \(y\) runs left-to-right, the region assignment converts each shot into the “JS court” coordinate system used by the web map via \(x_{JS} = y_{R}\) and \(y_{JS} = 43 - x_{R}\). Shots outside the half-court bounds are excluded from region assignment, and a small nearest-region fallback (within a fixed radius) is used when a point is very close to a region boundary.

After region labeling, the pipeline aggregates by **team × region** and sums expected points, while also tallying supporting context counts (jump shots, layups, dunks, hooks, and whether attempts came from turnovers, second chances, or fast breaks). To make values comparable across teams with different numbers of games played, each statistic is then scaled into a season-like pace using:

\[
\text{Stat Pace per 82} = \frac{\text{Stat Total}}{\text{Games Played}} \times 82
\]

This produces the final dataset consumed by the D3 app. On the website, each of the 14 polygons is drawn and its opacity is driven by the team’s **Expected Points pace per 82** in that region, which allows you to visually identify where a team is creating high-value opportunities (high-opacity regions) versus where its shot creation yields less expected scoring value (low-opacity regions).

### Developers
- Cam Bayusik (Front-end)
- Teddy Taussig (Front-end)
- Rento Saijo (Back-end)
