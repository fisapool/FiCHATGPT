def optimize_titles(titles, max_length=200, separator='|'):
    """
    Optimize product titles for SEO and e-commerce platforms.

    Parameters:
    titles (list): A list of product titles to optimize.
    max_length (int): The maximum length of the optimized title. Default is 200.
    separator (str): The character used to separate parts of the title. Default is '|'.

    Returns:
    list: A list of optimized product titles.
    """
    optimized_titles = []
    for title in titles:
        # Remove special characters and unnecessary formatting
        title = title.replace("[", "").replace("]", "").replace("|", "-").replace("+", "and").strip()
        
        # Standardize the title format and optimize for SEO
        if "SciSpace" in title:
            optimized_title = "SciSpace Typeset Premium | AI Copilot | ChatGPT Alternative"
        elif "ChatGPT" in title:
            optimized_title = "ChatGPT Plus Premium - 24/7 Access to Turbo GPT-4 Vision"
        elif "Turnitin" in title:
            if "CHEAPEST" in title:
                optimized_title = "Affordable Turnitin Plagiarism Checker & AI Writing Detection Tool - No Repository"
            else:
                optimized_title = "Turnitin Plagiarism Checker & AI Writing Detection Tool - No Repository"
        elif "Private ChatGPT" in title:
            optimized_title = "Private ChatGPT Plus - Warranty Included"
        elif "3u ChatGPT" in title:
            optimized_title = "3u ChatGPT 4 Plus - Warranty Provided"
        elif "ChatGPT Masterclass" in title:
            optimized_title = "ChatGPT Masterclass: Ultimate Beginner's Guide"
        else:
            optimized_title = title  # Fallback to original if no match
        
        # Further optimization for SEO
        optimized_title = optimized_title.replace(" - ", f" {separator} ")  # Use specified separator for better readability
        optimized_title = optimized_title.strip()  # Remove any leading/trailing whitespace
        
        # Ensure the title is within a reasonable length for SEO
        if len(optimized_title) > max_length:
            optimized_title = optimized_title[:max_length - 3] + "..."  # Truncate if too long
        
        optimized_titles.append(optimized_title)
    
    return optimized_titles

def optimize_shopee_descriptions(descriptions, max_length=500):
    """
    Optimize product descriptions for Shopee listings.

    Parameters:
    descriptions (list): A list of product descriptions to optimize.
    max_length (int): The maximum length of the optimized description. Default is 500.

    Returns:
    list: A list of optimized product descriptions.
    """
    optimized_descriptions = []
    
    for description in descriptions:
        # Remove unnecessary whitespace
        description = description.strip()
        
        # Example of enhancing the description
        if "high quality" not in description.lower():
            description += " This product is made from high-quality materials."
        
        if "easy to use" not in description.lower():
            description += " It is designed for easy use, making it perfect for everyone."
        
        # Ensure the description is within the specified length
        if len(description) > max_length:
            description = description[:max_length - 3] + "..."  # Truncate if too long
        
        optimized_descriptions.append(description)
    
    return optimized_descriptions

def validate_titles_input(titles_input):
    """
    Validate the input for product titles and return a list of titles.
    
    Parameters:
    titles_input (str): The input string containing product titles separated by commas.
    
    Returns:
    list: A list of validated product titles.
    """
    titles = [title.strip() for title in titles_input.split(',')]
    if len(titles) < 1 or any(title == "" for title in titles):
        print("Invalid input. Please enter at least one product title separated by commas.")
        return validate_titles_input(input("Enter product titles to optimize (separated by commas): "))
    return titles

def validate_descriptions_input(descriptions_input):
    """
    Validate the input for product descriptions and return a list of descriptions.
    
    Parameters:
    descriptions_input (str): The input string containing product descriptions separated by commas.
    
    Returns:
    list: A list of validated product descriptions.
    """
    descriptions = [desc.strip() for desc in descriptions_input.split(',')]
    if len(descriptions) < 1 or any(desc == "" for desc in descriptions):
        print("Invalid input. Please enter at least one product description separated by commas.")
        return validate_descriptions_input(input("Enter product descriptions to optimize (separated by commas): "))
    return descriptions

def ensure_titles_list(titles):
    """
    Ensure that the input is a list of product titles.
    
    Parameters:
    titles (str or list): The input containing product titles, either as a string or a list.
    
    Returns:
    list: A list of product titles.
    """
    if isinstance(titles, str):
        return validate_titles_input(titles)
    elif isinstance(titles, list):
        return [title.strip() for title in titles if title.strip()]  # Clean up whitespace and filter out empty titles
    else:
        print("Invalid input type. Please provide a string or a list of product titles.")
        return []

def ensure_descriptions_list(descriptions):
    """
    Ensure that the input is a list of product descriptions.
    
    Parameters:
    descriptions (str or list): The input containing product descriptions, either as a string or a list.
    
    Returns:
    list: A list of product descriptions.
    """
    if isinstance(descriptions, str):
        return validate_descriptions_input(descriptions)
    elif isinstance(descriptions, list):
        return [desc.strip() for desc in descriptions if desc.strip()]  # Clean up whitespace and filter out empty descriptions
    else:
        print("Invalid input type. Please provide a string or a list of product descriptions.")
        return []

def main():
    while True:
        # Ask for new titles
        new_titles_input = input("Enter product titles to optimize (separated by commas): ")
        new_titles = ensure_titles_list(new_titles_input)  # Ensure input is a list
        
        if not new_titles:  # If the list is empty, prompt again
            continue
        
        # Optimize the product titles
        optimized_product_titles = optimize_titles(new_titles)
        
        # Print the optimized titles
        print("\nOptimized Titles:")
        for title in optimized_product_titles:
            print(title)
        
        # Ask for descriptions
        new_descriptions_input = input("\nEnter product descriptions to optimize (separated by commas): ")
        new_descriptions = ensure_descriptions_list(new_descriptions_input)  # Ensure input is a list
        
        if not new_descriptions:  # If the list is empty, prompt again
            continue
        
        # Optimize the product descriptions
        optimized_product_descriptions = optimize_shopee_descriptions(new_descriptions)
        
        # Print the optimized descriptions
        print("\nOptimized Descriptions:")
        for description in optimized_product_descriptions:
            print(description)
        
        # Ask if the user wants to