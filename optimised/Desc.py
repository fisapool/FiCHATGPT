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

def main():
    while True:
        # Ask for new titles
        new_titles = input("Enter product titles to optimize (separated by commas): ").split(',')
        new_titles = [title.strip() for title in new_titles]  # Clean up whitespace
        
        # Optimize the product titles
        optimized_product_titles = optimize_titles(new_titles)
        
        # Print the optimized titles
        print("\nOptimized Titles:")
        for title in optimized_product_titles:
            print(title)
        
        # Ask if the user wants to optimize more titles
        continue_prompt = input("\nDo you want to optimize more titles? (yes/no): ").strip().lower()
        if continue_prompt != 'yes':
            print("Exiting the title optimization tool.")
            break

# Run the main function
if __name__ == "__main__":
    main()
