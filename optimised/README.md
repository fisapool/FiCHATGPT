# Product Optimization Tool

A command-line tool for optimizing product titles and descriptions for e-commerce platforms, with a focus on SEO.

## Features

- **Title Optimization**: Intelligently formats product titles based on product type, with specialized handling for different categories like SciSpace, ChatGPT, Turnitin, etc.
- **Description Enhancement**: Adds SEO-friendly phrases to product descriptions, improving search visibility.
- **Content Generation**: Automatically expands short descriptions to reach target word count (1500 words by default).
- **Length Management**: Ensures titles and descriptions stay within platform character limits.
- **User-Friendly CLI**: Simple interface with clear options for different optimization tasks.

## Usage

### Running the Tool

```bash
python optimized_product_optimizer.py
```

### Menu Options

1. **Optimize Titles**: Format and optimize product titles for SEO
2. **Optimize Descriptions**: Enhance product descriptions with SEO-friendly phrases
3. **Optimize Both**: Process both titles and descriptions
4. **Exit**: Quit the application

### Input Format

You can enter multiple items separated by commas or pipes:

```
Enter product titles to optimize: ChatGPT Plus, SciSpace Premium, Turnitin Checker
```

## Example Output

### Optimized Titles

Input:
```
ChatGPT Plus, SciSpace Premium, Turnitin Checker
```

Output:
```
ChatGPT Plus Premium | 24/7 Access to Turbo GPT-4 Vision
SciSpace Typeset Premium | AI Copilot | ChatGPT Alternative
Turnitin Plagiarism Checker & AI Writing Detection Tool - No Repository
```

### Optimized Descriptions

Input:
```
A powerful AI writing assistant.
```

Output:
```
A powerful AI writing assistant. This product is made from high-quality materials. It is designed for easy use, making it perfect for everyone. [Additional content automatically generated to reach 1500 words...]
```

The tool will automatically expand descriptions to reach the default target of 1500 words and will truncate descriptions that exceed 2000 words.

## Development

### Adding New Product Categories

To add support for new product categories, modify the `optimize_titles` function with new conditions:

```python
if "New Product" in title:
    optimized_title = "New Product Premium | Feature 1 | Feature 2"
```

### Customizing Description Enhancement

To add new enhancement phrases for descriptions, modify the `optimize_descriptions` function. 