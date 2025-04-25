const axios = require("axios");

async function getBudgetAdvice(spendingSummary) {
  // If no spending data, return a default message
  if (!spendingSummary || spendingSummary.trim() === '') {
    return "Start tracking your expenses to get personalized advice!";
  }

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    return "• Track your daily expenses consistently\n• Set a weekly budget for each category\n• Look for student discounts and deals";
  }

  try {
    const prompt = `Here is a student's weekly spending summary:\n${spendingSummary}\nGive 3 smart tips to save money next week in bullet points.`;

    const response = await axios.post("https://api.groq.com/v1/chat/completions", {
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI advice error:', error);
    return "• Review your spending patterns regularly\n• Consider using student meal plans\n• Save on transportation by walking or cycling when possible";
  }
}

module.exports = { getBudgetAdvice };
