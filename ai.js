const GEMINI_API_KEY = 'AIzaSyDfad6pmgoRwAAkQiLEcoQIot7ZlLI6WbI';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

document
  .getElementById('ai-form')
  .addEventListener('submit', async function (e) {
    e.preventDefault();

    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const goalInput = document.querySelector('input[name="goal"]:checked');

    if (!age || !weight || !height) {
      alert('Please fill in age, weight, and height.');
      return;
    }

    const gender = genderInput ? genderInput.value : 'not specified';
    const goal = goalInput ? goalInput.value : 'maintain weight';

    const bmi = (weight / (height / 100) ** 2).toFixed(1);

    const prompt = `
You are a professional nutritionist and dietitian. A person has provided the following data:
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi}
- Gender: ${gender}
- Goal: ${goal}

Please provide a detailed, personalized nutrition plan for this person. Include:
1. A brief assessment of their current stats (BMI category, caloric needs estimation)
2. Daily calorie target recommendation
3. Recommended macronutrient breakdown (protein, carbs, fats in grams)
4. A list of recommended foods they should eat regularly
5. Foods they should avoid or limit
6. A simple sample daily meal plan (breakfast, lunch, dinner, snacks)
7. 3 practical tips specific to their goal

Format the response clearly with section headers. Be friendly, encouraging, and specific to their data.
`;

    document.getElementById('result-section').style.display = 'none';
    document.getElementById('loading-section').style.display = 'block';
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('submit-btn').textContent = 'Generating...';

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API request failed');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('No response received from AI.');

      document.getElementById('loading-section').style.display = 'none';
      document.getElementById('result-section').style.display = 'block';
      document.getElementById('result-content').innerHTML =
        formatResponse(text);

      document
        .getElementById('result-section')
        .scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      document.getElementById('loading-section').style.display = 'none';
      document.getElementById('result-section').style.display = 'block';
      document.getElementById('result-content').innerHTML =
        `<p style="color:#f2a93b;">Error: ${error.message}</p><p>Please check your connection and try again.</p>`;
    } finally {
      document.getElementById('submit-btn').disabled = false;
      document.getElementById('submit-btn').textContent =
        'Get My Nutrition Plan';
    }
  });

function formatResponse(text) {
  return text
    .replace(
      /^### (.+)$/gm,
      '<h3 style="color:#caa169; margin-top:20px; margin-bottom:6px;">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 style="color:#f2a93b; margin-top:22px; margin-bottom:8px;">$1</h2>',
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 style="color:#f2a93b; margin-top:22px; margin-bottom:8px;">$1</h1>',
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#caa169;">$1</strong>')
    .replace(/^\* (.+)$/gm, '<li style="margin-left:18px;">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:18px;">$1</li>')
    .replace(/\n{2,}/g, '</p><p style="margin-top:10px;">')
    .replace(/^(?!<[hlp]|<li)(.+)$/gm, '$1')
    .replace(
      /^(<li.+<\/li>\n?)+/gm,
      (match) => `<ul style="margin:8px 0;">${match}</ul>`,
    );
}
