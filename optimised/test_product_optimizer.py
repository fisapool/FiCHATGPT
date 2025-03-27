import unittest
from optimized_product_optimizer import (
    optimize_titles,
    optimize_descriptions,
    validate_input,
    ensure_list
)

class TestProductOptimizer(unittest.TestCase):
    def test_optimize_titles(self):
        # Test basic title optimization
        titles = ["ChatGPT Product", "SciSpace Tool", "Turnitin CHEAPEST Service"]
        expected = [
            "ChatGPT Plus Premium | 24/7 Access to Turbo GPT-4 Vision",
            "SciSpace Typeset Premium | AI Copilot | ChatGPT Alternative",
            "Affordable Turnitin Plagiarism Checker & AI Writing Detection Tool | No Repository"
        ]
        result = optimize_titles(titles)
        self.assertEqual(result, expected)
        
        # Test title truncation
        long_title = "A" * 300
        result = optimize_titles([long_title])
        self.assertLessEqual(len(result[0]), 200)
        self.assertTrue(result[0].endswith("..."))
        
        # Test separator customization
        result = optimize_titles(["ChatGPT - Test"], separator="*")
        self.assertIn(" * ", result[0])
    
    def test_optimize_descriptions(self):
        # Test basic description optimization
        descriptions = ["A basic product description."]
        result = optimize_descriptions(descriptions)
        self.assertIn("high-quality materials", result[0])
        self.assertIn("easy use", result[0])
        
        # Test description with existing phrases
        description_with_phrases = "This is a high quality product that is easy to use."
        result = optimize_descriptions([description_with_phrases])
        self.assertEqual(result[0], description_with_phrases)
        
        # Test description length enforcement
        # Test that short descriptions get expanded to approach default count
        short_description = "This is a short description."
        result = optimize_descriptions([short_description], default_word_count=20, max_word_count=30)
        word_count = len(result[0].split())
        self.assertGreaterEqual(word_count, 20)
        
        # Test that overly long descriptions get truncated
        words = ["word"] * 3000  # Create a description with 3000 words
        long_description = " ".join(words)
        result = optimize_descriptions([long_description], default_word_count=1500, max_word_count=2000)
        word_count = len(result[0].split())
        self.assertLessEqual(word_count, 2001)  # Allow 1 more for potential "..." being counted
    
    def test_validate_input(self):
        # Test comma separation
        result = validate_input("item1, item2, item3")
        self.assertEqual(result, ["item1", "item2", "item3"])
        
        # Test pipe separation
        result = validate_input("item1|item2|item3")
        self.assertEqual(result, ["item1", "item2", "item3"])
        
        # Test mixed separators
        result = validate_input("item1, item2|item3")
        self.assertEqual(result, ["item1", "item2", "item3"])
    
    def test_ensure_list(self):
        # Test with string input
        result = ensure_list("item1, item2")
        self.assertEqual(result, ["item1", "item2"])
        
        # Test with list input
        result = ensure_list(["item1", "  item2  ", ""])
        self.assertEqual(result, ["item1", "item2"])
        
        # Test with empty list
        result = ensure_list([])
        self.assertEqual(result, [])

if __name__ == "__main__":
    unittest.main() 