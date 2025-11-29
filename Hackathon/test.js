// ==============================
// CONFIG
// ==============================
const WEBHOOK_URL = "https://zxjm2505.app.n8n.cloud/webhook/as";

// ==============================
// FORM REFERENCES
// ==============================
const solarForm = document.getElementById("solarPlanningForm");
const energyForm = document.getElementById("energySellingForm");

// Output boxes
const feature1Output = document.querySelector('#feature1 .output-box');
const feature2Output = document.querySelector('#feature2 .output-box');

// ==============================
// GENERIC SEND FUNCTION
// ==============================
async function sendToWebhook(payload, outputBox) {
    outputBox.innerHTML = "<em>Sending...</em>";

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        // Handle wrapper 'output' if present
        const out = json.output || json;

        // Build tidy HTML output
        let html = "<h3>User Input</h3><ul>";
        for (const [key, value] of Object.entries(payload.body || payload)) {
            if (key !== "analysis" && key !== "recommendation") {
                html += `<li><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</li>`;
            }
        }
        html += "</ul>";

        html += "<h3>AI Analysis</h3>";
        html += `<p>${out.analysis || "N/A"}</p>`;

        html += "<h3>AI Recommendation</h3>";
        html += `<p>${out.recommendation || "N/A"}</p>`;

        outputBox.innerHTML = html;

    } catch (err) {
        outputBox.textContent = "Error: " + err.message;
    }
}

// ==============================
// FEATURE 1 — SOLAR PLANNING
// ==============================
solarForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(solarForm);

    const data = {
        body: {  // wrap in 'body' to match AI parser
            Building_Name: fd.get("building_name"),
            Location: fd.get("location"),
            Roof_Area_: Number(fd.get("roof_area_m2")),
            Roof_Orientation: fd.get("roof_orientation") ,
            Monthly_Consumption_kWh: Number(fd.get("monthly_consumption_kwh")),
            Installation_Cost: Number(fd.get("installation_cost")),
            analysis: "",
            recommendation: ""
        }
    };

    await sendToWebhook(data, feature1Output);
});

// ==============================
// FEATURE 2 — ENERGY SELLING
// ==============================
energyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(energyForm);

    const data = {
        body: {
            battery_capacity: Number(fd.get("battery_capacity") || 0),
            panel_capacity: Number(fd.get("panel_capacity") || 0),
            sell_rate: Number(fd.get("sell_rate") || 0),
            avg_usage: Number(fd.get("avg_usage") || 0),
            gov_incentive: Number(fd.get("gov_incentive") || 0),
            analysis: "",
            recommendation: ""
        }
    };

    await sendToWebhook(data, feature2Output);
});
