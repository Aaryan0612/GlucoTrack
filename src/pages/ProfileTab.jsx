import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, UserCheck, Flame, Scale, CheckCircle2, XCircle, Heart, Dumbbell } from 'lucide-react';
import './ProfileTab.css';

function ProfileTab() {
  const { settings, updateSettings, showToast } = useApp();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(settings?.userName || '');
  const [age, setAge] = useState(settings?.age || 51);
  const [height, setHeight] = useState(settings?.height || 155);
  const [weight, setWeight] = useState(settings?.weight || 60);
  const [hasKneePain, setHasKneePain] = useState(settings?.hasKneePain ?? true);
  const [hasDiabetes, setHasDiabetes] = useState(settings?.hasDiabetes ?? true);

  if (!settings) return null;

  // Calculators
  const weightKg = Number(weight) || 60;
  const heightM = (Number(height) || 155) / 100;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);
  const proteinTargetG = Math.round(weightKg * 1.2); // 1.2g per kg recommendation

  let bmiCategory = 'Normal';
  let bmiColor = 'var(--color-normal)';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight / कमी वजन';
    bmiColor = 'var(--color-low)';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Overweight / वाढलेले वजन';
    bmiColor = 'var(--color-caution)';
  } else if (bmi >= 30) {
    bmiCategory = 'Obese / लठ्ठपणा';
    bmiColor = 'var(--color-high)';
  }

  const handleSave = async (e) => {
    e.preventDefault();
    await updateSettings({
      userName: name.trim(),
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      hasKneePain,
      hasDiabetes,
    });
    showToast('Profile metrics updated ✓');
    setEditMode(false);
  };

  return (
    <div className="profile-tab-content">
      {editMode ? (
        <form onSubmit={handleSave} className="card profile-edit-card">
          <h2 className="profile-sec-title">Edit Profile Metrics / माहिती बदला</h2>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Age / वय</label>
              <input
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                className="form-input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="50"
                required
              />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                className="form-input"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="10"
                required
              />
            </div>
          </div>

          <div className="checkbox-section">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={hasKneePain}
                onChange={(e) => setHasKneePain(e.target.checked)}
              />
              <span>Has knee pain? / गुडघेदुखी आहे का?</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={hasDiabetes}
                onChange={(e) => setHasDiabetes(e.target.checked)}
              />
              <span>Has Type 2 Diabetes? / मधुमेह आहे का?</span>
            </label>
          </div>

          <div className="edit-actions">
            <button type="submit" className="btn-primary">Save Changes</button>
            <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {/* Card 1: Mom's Physical Metrics overview */}
          <section className="card stats-overview-card">
            <div className="profile-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserCheck size={28} className="icon-brand" />
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>{settings.userName}</h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Age: {settings.age} yrs • Height: {settings.height} cm • Weight: {settings.weight} kg
                  </p>
                </div>
              </div>
              <button className="btn-edit-profile" onClick={() => setEditMode(true)}>
                Edit Info
              </button>
            </div>

            <div className="metrics-summary-grid">
              <div className="metric-box">
                <Flame size={20} style={{ color: 'var(--color-accent)' }} />
                <span className="metric-val">{proteinTargetG} g</span>
                <span className="metric-lbl">Daily Protein Target / प्रथिनांची गरज</span>
              </div>
              <div className="metric-box">
                <Scale size={20} style={{ color: bmiColor }} />
                <span className="metric-val">{bmi}</span>
                <span className="metric-lbl" style={{ color: bmiColor, fontWeight: 700 }}>
                  {bmiCategory}
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Custom Diet Tips - strictly sugar free / bakery free */}
          <section className="card diet-matrix-card">
            <h2 className="profile-sec-title">Mom's Custom Diabetes Diet / आईचा आहार तक्ता 🥦</h2>
            
            <div className="diet-grids">
              <div className="diet-column avoid">
                <h3>
                  <XCircle size={18} /> Avoid completely / पूर्णपणे टाळा
                </h3>
                <ul>
                  <li>❌ All forms of sugar & sweets (साखर आणि गोड पदार्थ)</li>
                  <li>❌ Bakery items (toast, biscuits, khari, bread)</li>
                  <li>❌ Chapati / Roti made of wheat (गव्हाची चपाती टाळा)</li>
                  <li>❌ White Rice (पांढरा भात)</li>
                  <li>❌ Watermelon (टरबूज - High glycemic index)</li>
                  <li>❌ Sugarcane juice (उसाचा रस)</li>
                  <li>❌ Coconut water (शहाळ्याचे पाणी - contains high carbs/sugars)</li>
                </ul>
              </div>

              <div className="diet-column prefer">
                <h3>
                  <CheckCircle2 size={18} /> Highly Preferred / आवर्जून खा
                </h3>
                <ul>
                  <li>✅ Nachnichi bhakri (नाचणीची भाकरी - Best for sugar)</li>
                  <li>✅ Jowar & Bajra bhakri (ज्वारी/बाजरी भाकरी)</li>
                  <li>✅ Peru / Guava (पेरू - Excellent for diabetes)</li>
                  <li>✅ Guava, apple, oranges, grapes (in moderate quantity)</li>
                  <li>✅ Dal & Sprouts (उसळ, डाळ - rich in protein)</li>
                  <li>✅ Green leafy vegetables (पालेभाज्या आणि कोशिंबीर)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Card 3: Bone & Supplement guidance for age 51 with knee pain */}
          <section className="card guidance-card">
            <h2 className="profile-sec-title">
              <Heart size={20} style={{ color: 'var(--color-accent)', inlineSize: 'auto' }} /> 
              Daily Bone & Supplement Guide / पूरक जीवनसत्त्वे
            </h2>
            <div className="guidance-grid">
              <article className="guidance-box">
                <strong>Calcium & Vitamin D3 🦴</strong>
                <p>
                  As a 51-year-old experiencing knee pain, daily intake of Calcium (1200mg) and Vitamin D3 (800IU) is critical to reinforce joint cartilage and alleviate friction during sit-to-stand movements.
                </p>
              </article>

              <article className="guidance-box warning">
                <strong>Vitamin B12 (Metformin Care) ⚠️</strong>
                <p>
                  Metformin (a standard diabetes medicine) is medically proven to decrease B12 absorption. A daily B12 supplement (2.4mcg) is highly suggested to prevent diabetic neuropathy, fatigue, and muscle weakness.
                </p>
              </article>

              <article className="guidance-box">
                <strong>Magnesium & Omega-3 🐟</strong>
                <p>
                  Magnesium aids in muscle relaxation (reduces cramps), while Omega-3 fatty acids act as anti-inflammatories to soothe knee joint pain.
                </p>
              </article>
            </div>
          </section>

          {/* Card 4: Actionable Gentle Exercise routine */}
          <section className="card guidance-card">
            <h2 className="profile-sec-title">
              <Dumbbell size={20} style={{ color: 'var(--color-primary)', inlineSize: 'auto' }} />
              Gentle Knee & Diabetes Routine / व्यायाम सल्ला
            </h2>
            <div className="guidance-grid">
              <article className="guidance-box">
                <strong>1. Supported Chair Stands (8 Reps)</strong>
                <p>Sitting down and standing up from a stable chair with arm support. Strengthens quadriceps to reduce knee pressure.</p>
              </article>
              <article className="guidance-box">
                <strong>2. Ankle & Leg Raises (10 reps each)</strong>
                <p>While sitting, extend the knee straight and hold for 5 seconds. Repeat with ankle rotations for blood circulation.</p>
              </article>
              <article className="guidance-box">
                <strong>3. Balanced Walking (20-30 mins)</strong>
                <p>Light walk split into two short sessions (15 mins each) to regulate blood sugar without overworking the knee joints.</p>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ProfileTab;
