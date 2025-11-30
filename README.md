# 🌞 Solar Future

## Problem Statement:
**Homeowners and small businesses struggle to optimize solar energy usage due to unpredictable weather, unclear cost-benefit analysis, and lack of insight into selling excess energy.**  
This prototype helps users **estimate savings, maximize ROI, and manage energy selling** using AI-driven planning.

---
---
# Limitations
- Limited database is prepared, but it could be done by using ```'full_weather.csv'``` available in ```Kaggle - Malaysia's Weather Data (1996-2024)``` and ```separate_database.ipynb```

References: 
```python
https://www.kaggle.com/datasets/shahmirvarqha/weather-data-malaysia/data
```
---
---

# 🚀 Features

## **Feature 1: Solar Energy Planning**
Estimate energy production and savings based on your solar setup.

**Input Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Building Name | Text | Home / Office / School |
| Location | Text | State / City (e.g., Kuala Lumpur) |
| Roof Area | Number (m²) |  |
| Roof Orientation | Number (°) | Optional |
| Monthly Consumption | Number (kWh) |  |
| Budget | Number (RM) |  |

**Output:**
- Estimated solar energy generation
- Monthly & yearly savings
- ROI and break-even time

---

## **Feature 2: Energy Selling**
Sell excess energy back to the grid and optimize revenue.

**Input Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Current Battery Capacity | Number (kWh) |  |
| Panel Capacity | Number (kW) |  |
| Electricity Sell-back Rate | Number (RM/kWh) |  |
| Average Usage | Number (kWh/day) |  |
| Government Incentive | Number (RM) | Optional |

**Output:**
- Estimated sell-back energy
- Revenue calculation
- Incentive contributions

---

### **Feature 3: Weather & Savings Forecast**
Forecast energy production and rebates using predictive models.

**Input Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Solar Panel Area | Number (m²) |  |
| Solar Panel Efficiency | Number (%) |  |
| Earn Rate | Number (RM per kWh) | Example: 0.2, 0.3, 0.5 |
| Location | Text | State / City |

**Output:**
- Predicted sunny/rainy days next month
- Monthly energy production estimate
- Estimated rebate and earnings

---

## ⚙️ Technology Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** FastAPI, Python  
- **Machine Learning:** Scikit-learn (Random Forest Regressor)  
- **Data Storage:** CSV datasets for weather & energy prediction  
- **Server:** Uvicorn  

---
---

## 💻 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YourUsername/SolarOptimizationPrototype.git
cd SolarOptimizationPrototype
```

2. **Create & activate a virtual environment:**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the FastAPI server:**
```bash
cd MachineLearning
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

5. **Open the frontend:**
```bash
Open Solar/solar.html in your browser.
```

---
---
## 📧 Contact
For questions or support, contact...

1. Lee Jun Ming (myleejm23@gmail.com)
2. Austin (austinteo111@gmail.com)
3. Law Jun You (junyoulaw727@gmail.com)
4. Ku Xiang Jin (kuxiangjin1004@gmail.com)

