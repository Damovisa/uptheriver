# Up the River – Score Tracker

A mobile-friendly, single-page web app for scoring games of **Up the River, Down the River** (also known as "Oh Hell").

## Features

- Add 2–10 players with custom names
- Configurable max cards per hand (default 10 → gives 20 hands: 10→1, then 1→10)
- Per-player trick predictions at the start of each hand
- Automatic scoring: **tricks won + 10 bonus** if prediction is exact
- Running scoreboard updated after every hand
- Final results screen with ranking
- Works on desktop and mobile

## Scoring rules

| Result | Points |
|---|---|
| Prediction correct | tricks won + 10 |
| Prediction wrong | tricks won |

## Deployment to GitHub Pages

### First-time setup

1. Go to **Settings → Pages** in this repository.
2. Under **Source**, select **GitHub Actions**.
3. Push to (or merge a PR into) the `main` branch — the **Deploy to GitHub Pages** workflow will run automatically and publish the site.

### Manual deployment

You can also trigger the workflow manually from **Actions → Deploy to GitHub Pages → Run workflow**.

### Live URL

After the first successful deployment the site will be available at:

```
https://<your-github-username>.github.io/uptheriver/
```

## Screenshots

### Setup screen – configure players and max cards
![Setup screen showing three player name fields (Alice, Bob, Carol) and max cards set to 5](screenshots/01-setup.png)

### Predict phase – enter trick predictions for hand 1
![Game screen in predicting phase with predictions 2, 1, 1 entered for the first hand of 5 cards](screenshots/02-predict.png)

### Tricks phase – enter actual tricks won
![Game screen in tricks phase after locking predictions, with tricks 3, 1, 1 entered](screenshots/03-tricks.png)

### Mid-game scoreboard – populated after several hands
![Game screen showing a scrollable scoreboard with scores from completed hands and the predict phase for the current hand](screenshots/04-scoreboard.png)

### Results screen – final rankings
![Results screen displaying final scores and rankings for Alice, Bob, and Carol](screenshots/05-results.png)
