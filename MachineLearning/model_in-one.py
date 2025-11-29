import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os

# Load data
state = 'kuala_lumpur'
df = pd.read_csv(f"MachineLearning/dataset/{state}.csv")
df["datetime"] = pd.to_datetime(df["datetime"])
df["is_rainy"] = df["precipitation_total"] > 0
df["date"] = df["datetime"].dt.date

# Daily and monthly aggregation
daily_rain = df.groupby(["state", "date"])["is_rainy"].max().reset_index()
daily_rain["month"] = pd.to_datetime(daily_rain["date"]).dt.to_period("M")
monthly_rain = daily_rain.groupby(["state", "month"])["is_rainy"].sum().reset_index()
monthly_rain.rename(columns={"is_rainy": "rainy_days"}, inplace=True)

# Encode and prepare features
le = LabelEncoder()
monthly_rain["state_code"] = le.fit_transform(monthly_rain["state"])
monthly_rain["month_number"] = monthly_rain["month"].dt.month
X = monthly_rain[["state_code", "month_number"]]
y = monthly_rain["rainy_days"]

# Train-test split for evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"MAE: {mae}, MSE: {mse}, R²: {r2}")

folder_path = "MachineLearning/models"
os.makedirs(folder_path, exist_ok=True)

# Save model and encoder for FastAPI
with open("MachineLearning/models/rain_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("MachineLearning/models/state_encoder.pkl", "wb") as f:
    pickle.dump(le, f)


print(le.classes_)