
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
        
        if len(optimized_title) > max_length:
            optimized_title = optimized_title[:max_length]  # Truncate if too long
        optimized_titles.append(optimized_title)

    
    return optimized_titles

import re

def validate_titles_input(titles_input):

    """
    Validate the input for product titles and return a list of titles.
    
    Parameters:
    titles_input (str): The input string containing product titles separated by commas.
    
    Returns:
    list: A list of validated product titles.
    """
    titles = [title.strip() for title in re.split(r'[,\|]', titles_input)]

    if len(titles) < 1 or any(title == "" for title in titles):
        print("Invalid input. Please enter at least one product title separated by commas or use a valid separator (comma or pipe).")

        return validate_titles_input(input("Enter product titles to optimize (separated by commas): "))
    return titles

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

def main():
    while True:
        # Ask for new titles
        new_titles_input = input("Enter product titles to optimize (separated by commas): \n")

        if not new_titles_input.strip():  # Check for empty input
            print("Invalid input. Please enter at least one product title.")
            continue
        
        new_titles = ensure_titles_list(new_titles_input)  # Ensure input is a list

        
        # Optimize the product titles
        optimized_product_titles = optimize_titles(new_titles)
        
        # Print the optimized titles
        print("\nOptimized Titles:")
        for title in optimized_product_titles:
            print(title)  # Print each optimized title on a new line























        
        # Ask if the user wants to optimize more titles
        continue_prompt = input("\nDo you want to optimize more titles? (1 for Yes, 2 for No): ").strip().lower()
        if continue_prompt not in ['1', 'yes']:  # Check if the user wants to continue


            print("Exiting the title optimization tool.")
            break

        if continue_prompt != 'yes':
            print("Exiting the title optimization tool.")
            break

# Run the main function
if __name__ == "__main__":
    main()
