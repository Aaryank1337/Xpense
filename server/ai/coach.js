const axios = require("axios");

async function getBudgetAdvice(spendingSummary) {
  // If no spending data, return a default message
  if (!spendingSummary || spendingSummary.trim() === '') {
    return "Start tracking your expenses to get personalized advice!";
  }

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not configured in environment variables');
    return "• Track your daily expenses consistently\n• Set a weekly budget for each category\n• Look for student discounts and deals\n\nNote: AI personalization is temporarily unavailable";
  }

  try {
    const prompt = `Here is a student's weekly spending summary:\n${spendingSummary}\nGive 3 smart tips to save money next week in bullet points.`;

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
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

async function getSpendingAnalysis(spendingData) {
  // If no spending data, return a default message
  if (!spendingData || Object.keys(spendingData).length === 0) {
    return {
      insights: "Start tracking your expenses to get personalized spending analysis!",
      trends: null
    };
  }

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not configured in environment variables');
    return {
      insights: "• Your spending appears to be concentrated in a few categories\n• Consider setting budget limits for each category\n• Track your expenses daily for better insights\n\nNote: AI personalization is temporarily unavailable",
      trends: identifyTrends(spendingData)
    };
  }

  try {
    // Format the spending data for the AI
    const formattedData = Object.entries(spendingData)
      .map(([category, details]) => {
        return `${category}: ₹${details.total} (${details.percentage}% of total spending)`;
      })
      .join('\n');

    const prompt = `Here is a student's spending breakdown by category:\n${formattedData}\n\nProvide the following analysis:\n1. Give 3-4 specific insights about spending patterns in bullet points\n2. Identify which categories seem to be taking the most money and suggest if any appear excessive\n3. Suggest one specific action for each major spending category to optimize expenses`;

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return {
      insights: response.data.choices[0].message.content,
      trends: identifyTrends(spendingData)
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      insights: "• Your highest spending categories may need budget limits\n• Look for patterns in your discretionary spending\n• Consider alternatives for your most expensive categories",
      trends: identifyTrends(spendingData)
    };
  }
}

// Helper function to identify spending trends
function identifyTrends(spendingData) {
  // Sort categories by amount spent (descending)
  const sortedCategories = Object.entries(spendingData)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([category, details]) => ({
      category,
      amount: details.total,
      percentage: details.percentage
    }));

  // Identify top spending categories (top 3 or all if less than 3)
  const topCategories = sortedCategories.slice(0, Math.min(3, sortedCategories.length));
  
  // Identify categories with small spending (bottom 30% if more than 3 categories)
  const smallSpendingThreshold = sortedCategories.length > 3 ? 
    sortedCategories[Math.floor(sortedCategories.length * 0.7)].amount : 0;
  
  const smallCategories = sortedCategories
    .filter(item => item.amount <= smallSpendingThreshold)
    .slice(0, 3); // Take at most 3 small categories

  return {
    topCategories,
    smallCategories,
    totalCategories: sortedCategories.length
  };
}

module.exports = { getBudgetAdvice, getSpendingAnalysis };
