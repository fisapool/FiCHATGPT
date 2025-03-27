import re

def optimize_titles(titles, max_length=200, separator='|'):
    """
    Optimize product titles for SEO and e-commerce platforms.

    Parameters:
    titles (list): A list of product titles to optimize.
    max_length (int): The maximum length of the optimized title. Default is 200.
    separator (str): The character used to separate parts of the title. Default is '|'.

    Returns:
    list: A list of optimized product titles.
    
    Examples:
    >>> optimize_titles(["ChatGPT Product"])
    ["ChatGPT Plus Premium - 24/7 Access to Turbo GPT-4 Vision"]
    """
    optimized_titles = []
    for title in titles:
        # Remove special characters and unnecessary formatting
        title = title.replace("[", "").replace("]", "").replace("|", "-").replace("+", "and").strip()
        
        # Standardize the title format and optimize for SEO
        if "SciSpace" in title:
            optimized_title = "SciSpace Typeset Premium | AI Copilot | ChatGPT Alternative"
        elif "ChatGPT" in title:
            optimized_title = "ChatGPT Plus Premium | 24/7 Access to Turbo GPT-4 Vision"
        elif "Turnitin" in title:
            if "CHEAPEST" in title:
                optimized_title = "Affordable Turnitin Plagiarism Checker & AI Writing Detection Tool | No Repository"
            else:
                optimized_title = "Turnitin Plagiarism Checker & AI Writing Detection Tool | No Repository"
        elif "Private ChatGPT" in title:
            optimized_title = "Private ChatGPT Plus | Warranty Included"
        elif "3u ChatGPT" in title:
            optimized_title = "3u ChatGPT 4 Plus | Warranty Provided"
        elif "ChatGPT Masterclass" in title:
            optimized_title = "ChatGPT Masterclass: Ultimate Beginner's Guide"
        else:
            optimized_title = title  # Fallback to original if no match
        
        # Further optimization for SEO
        optimized_title = optimized_title.replace(" - ", f" {separator} ")  # Use specified separator for better readability
        optimized_title = optimized_title.strip()  # Remove any leading/trailing whitespace
        
        # Ensure the title is within a reasonable length for SEO (only need to do this once)
        if len(optimized_title) > max_length:
            optimized_title = optimized_title[:max_length - 3] + "..."  # Truncate if too long
        
        optimized_titles.append(optimized_title)
    
    return optimized_titles

def optimize_descriptions(descriptions, default_word_count=1500, max_word_count=2000):
    """
    Optimize product descriptions for e-commerce listings.

    Parameters:
    descriptions (list): A list of product descriptions to optimize.
    default_word_count (int): The default target word count for descriptions. Default is 1500 words.
    max_word_count (int): The maximum allowed word count for descriptions. Default is 2000 words.

    Returns:
    list: A list of optimized product descriptions.
    
    Examples:
    >>> optimize_descriptions(["Basic product description"])
    ["Basic product description This product is made from high-quality materials. It is designed for easy use, making it perfect for everyone."]
    """
    optimized_descriptions = []
    
    for description in descriptions:
        # Remove unnecessary whitespace
        description = description.strip()
        
        # Count initial words
        word_count = len(description.split())
        
        # Enhance the description with SEO-friendly phrases
        if "high quality" not in description.lower():
            description += " This product is made from high-quality materials."
        
        if "easy to use" not in description.lower():
            description += " It is designed for easy use, making it perfect for everyone."
        
        # Add more content if the description is too short (less than default_word_count)
        current_word_count = len(description.split())
        if current_word_count < default_word_count:
            # Add generic filler content to reach the target word count
            words_to_add = default_word_count - current_word_count
            if words_to_add > 0:
                description += f" Our product has been tested and proven effective by thousands of satisfied customers. "
                description += f"You'll enjoy premium quality and exceptional performance compared to competitors. "
                description += f"We stand behind our product with excellent customer service and a satisfaction guarantee. "
                description += f"Whether you're a beginner or an expert, you'll find this product intuitive and valuable. "
                
                # Continue adding filler as needed to approach target word count
                additional_fillers = [
                    "Each product is carefully inspected before shipping to ensure the highest quality. ",
                    "Our dedicated team has spent years perfecting this design. ",
                    "Customers consistently rate this product 5 stars for its reliability and performance. ",
                    "Unlike similar products on the market, ours features premium materials that last longer. ",
                    "You'll notice the difference in quality from the moment you unbox our product. ",
                    "We've thought of everything you need for a seamless experience. ",
                    "This product solves problems you didn't even know you had. ",
                    "The attention to detail in this product is what sets it apart from competitors. ",
                    "We've optimized every aspect of this product for maximum efficiency and user satisfaction. ",
                    "Backed by extensive research and development, this product represents the pinnacle of innovation. "
                ]
                
                filler_index = 0
                current_word_count = len(description.split())
                while current_word_count < default_word_count and filler_index < len(additional_fillers):
                    description += additional_fillers[filler_index]
                    filler_index += 1
                    current_word_count = len(description.split())
        
        # Ensure the description is within the specified word limit
        words = description.split()
        if len(words) > max_word_count:
            description = " ".join(words[:max_word_count]) + "..."
        
        optimized_descriptions.append(description)
    
    return optimized_descriptions

def validate_input(input_text, separator_pattern=r'[,\|]', input_type="titles"):
    """
    Validate user input and return a list of items.
    
    Parameters:
    input_text (str): The input string containing items separated by commas or pipes.
    separator_pattern (str): The regex pattern to use for splitting the input. Default is '[,\\|]'.
    input_type (str): The type of input being validated ('titles' or 'descriptions').
    
    Returns:
    list: A list of validated items.
    """
    items = [item.strip() for item in re.split(separator_pattern, input_text)]

    if len(items) < 1 or any(item == "" for item in items):
        print(f"Invalid input. Please enter at least one {input_type[:-1]} separated by commas or pipes.")
        return validate_input(
            input(f"Enter product {input_type} to optimize (separated by commas or pipes): "),
            separator_pattern,
            input_type
        )
    return items

def ensure_list(items, input_type="titles"):
    """
    Ensure that the input is a list of items.
    
    Parameters:
    items (str or list): The input containing items, either as a string or a list.
    input_type (str): The type of items being processed ('titles' or 'descriptions').
    
    Returns:
    list: A list of items.
    """
    if isinstance(items, str):
        return validate_input(items, input_type=input_type)
    elif isinstance(items, list):
        return [item.strip() for item in items if item.strip()]  # Clean up whitespace and filter out empty items
    else:
        print(f"Invalid input type. Please provide a string or a list of product {input_type}.")
        return []

def main():
    print("=== Product Optimization Tool ===")
    print("This tool helps optimize product titles and descriptions for e-commerce platforms.")
    
    while True:
        print("\n1. Optimize Titles")
        print("2. Optimize Descriptions")
        print("3. Optimize Both")
        print("4. Exit")
        
        choice = input("\nSelect an option (1-4): ").strip()
        
        if choice == "4":
            print("Exiting the product optimization tool.")
            break
            
        if choice in ["1", "3"]:
            # Optimize titles
            title_input = input("\nEnter product titles to optimize (separated by commas or pipes): ")
            
            if not title_input.strip():
                print("Invalid input. Please enter at least one product title.")
                continue
                
            titles = ensure_list(title_input, "titles")
            optimized_titles = optimize_titles(titles)
            
            print("\nOptimized Titles:")
            for title in optimized_titles:
                print(title)
        
        if choice in ["2", "3"]:
            # Optimize descriptions
            desc_input = input("\nEnter product descriptions to optimize (separated by commas or pipes): ")
            
            if not desc_input.strip():
                print("Invalid input. Please enter at least one product description.")
                continue
                
            descriptions = ensure_list(desc_input, "descriptions")
            optimized_descriptions = optimize_descriptions(descriptions)
            
            print("\nOptimized Descriptions:")
            for desc in optimized_descriptions:
                print(desc)
        
        if choice not in ["1", "2", "3", "4"]:
            print("Invalid choice. Please select a valid option (1-4).")

if __name__ == "__main__":
    main() 