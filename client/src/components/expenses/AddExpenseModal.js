import React, { useState } from "react";
import { addExpense } from "../../services/api";
import axios from "axios"; // Import axios to call transferTokens API
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
} from "@mui/material";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Education",
  "Shopping",
  "Healthcare",
  "Other",
];

const AddExpenseModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.description || !formData.amount || !formData.category) {
      setError("Please fill in all fields");
      return;
    }

    if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);

      console.log("Adding expense with data:", formData);

      // 1. Add the expense
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      console.log(
        "Expense added successfully. Now attempting to transfer reward token..."
      );

      // 2. Try transferring 1 token after expense is added
      await transferRewardToken();

      console.log("Token reward transfer completed successfully.");

      // 3. Reset form and close modal
      setFormData({
        description: "",
        amount: "",
        category: "",
      });
      onClose();
    } catch (err) {
      console.error("Error adding expense or transferring token:", err);
      console.error("Detailed Error Info:", {
        message: err.message,
        responseData: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      setError(
        err.response?.data?.message ||
          "Failed to add expense or transfer token. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const transferRewardToken = async () => {
    try {
      console.log("Calling /api/tokens/transfer to reward user...");
  
      // Fetch token from localStorage (or sessionStorage or state)
      const token = localStorage.getItem("token"); // Replace with your actual token fetching logic
  
      // Make sure token is available before making the request
      if (!token) {
        console.error("No token found. Please log in again.");
        return false;
      }
  
      // Send the token as Authorization header
      const response = await axios.post(
        "http://localhost:5000/api/tokens/transfer",
        { amount: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add the token here
          },
        }
      );
  
      console.log("TransferTokens API Response:", response.data);
  
      return true;
    } catch (err) {
      console.error("Token reward transfer failed:", err);
      console.error("Detailed Transfer Error Info:", {
        message: err.message,
        responseData: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
  
      // Capture any specific error message from the response body
      const errorMessage = err.response?.data?.message || "Unknown error";
      alert(`Error: ${errorMessage}`);
  
      return false;
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Expense</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            value={formData.description}
            onChange={handleChange}
            required
          />

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              margin="dense"
              label="Amount (₹)"
              name="amount"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={handleChange}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
                required
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Add Expense
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddExpenseModal;
