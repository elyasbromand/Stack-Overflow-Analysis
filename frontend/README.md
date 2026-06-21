# Stack Overflow Analysis Dashboard Report

## Project Overview

This frontend is a business analytics dashboard for a Stack Overflow data warehouse. It connects to the backend API, reads real analytical responses, and presents them as a clean report for understanding question volume, category movement, tag demand, decline ranking, and engagement quality.

The goal of the dashboard is not only to show charts, but to explain the story inside the data. A user can start from the Overview page, read the key findings, then move through the sidebar pages for deeper analysis.

## Business Purpose

Stack Overflow activity changes over time. Some topics grow, some decline, and user engagement can shift through score, answers, and views. This dashboard helps answer business-style questions such as:

- How many questions are available in the warehouse?
- Which year had the highest activity?
- Is recent question volume increasing or decreasing?
- Which categories are gaining or losing share?
- Which tags receive the most questions?
- Which tags show the strongest decline or movement?
- Are questions still receiving answers, views, and score engagement?



### Report

This section gives the high-level view.

- **Overview**: The main executive dashboard. It combines multiple API endpoints and shows KPI cards, decision summary, category mix, volume trend, recent monthly momentum, engagement quality, top tags, and movement tags.
- **Summary**: A focused KPI page for total questions, peak year, latest volume, and infrastructure share movement. It includes filters for selecting a year range.

### Trend Analysis

This section explains how the dataset changes over time.

- **Yearly Category**: Shows yearly question volume by category. It helps compare category performance across years and shows the category split for a selected year.
- **Category Share**: Shows percentage share by category. It highlights which category has the largest share and how share changed from the first year to the selected year.
- **Monthly Recent**: Shows recent monthly question counts. It helps identify short-term drops, spikes, and recent momentum.

### Question Detail

This section gives deeper tag-level and engagement analysis.

- **Tag Breakdown**: Shows top tags by question count for a selected year, including average score context.
- **Decline Ranking**: Shows tags with the strongest movement or decline signal. It helps identify where demand changed most strongly.
- **Engagement**: Shows average score, answers, and views over time. It helps understand whether question quality and attention are improving or declining.

## Main Analytics Explained

### Total Questions Sampled

This KPI shows how many Stack Overflow questions are available in the warehouse. It is the overall size of the analysis sample.

### Peak Activity Year

This shows the year with the highest number of questions. It is useful as a benchmark for comparing current activity against the strongest historical year.

### Latest Yearly Volume

This shows the most recent yearly question volume. The dashboard compares it with the previous year to show whether activity is rising or falling.

### Change From Peak

This shows how far the latest year is from the peak year. It is one of the most important business indicators because it explains the size of the decline or recovery.

### Category Mix

This shows how question volume is distributed across categories. It helps explain which areas dominate the dataset.

### Category Share Movement

This shows how category percentage share changes over time. It helps identify whether categories such as infrastructure, application, data, or AI/ML are becoming more or less important.

### Tag Demand

This shows which tags receive the most questions in a selected year. It helps identify the strongest topic demand.

### Decline Ranking

This shows tags with the strongest movement signal. It is useful for identifying topics that are losing activity or changing quickly.

### Engagement Quality

This uses average score, answer count, and view count. It helps measure whether questions are receiving useful community attention.

## User Journey

1. Open the dashboard and start with **Overview**.
2. Read the KPI cards and **Decision Summary** to understand the main findings.
3. Go to **Summary** to filter the report by year range.
4. Use **Yearly Category** and **Category Share** to understand category-level change.
5. Use **Monthly Recent** to inspect short-term movement.
6. Use **Tag Breakdown** to identify high-demand tags.
7. Use **Decline Ranking** to find tags with the strongest movement.
8. Use **Engagement** to evaluate quality and attention trends.

## Technology Stack

- React
- Vite
- React Router
- Axios
- Recharts
- Tailwind CSS

