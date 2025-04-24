import random
from skills.models import SkillProfile, Category
from api.models import CustomUser
import django
import os

# Setup Django environment if running standalone
# Get the directory of the current script
# current_dir = os.path.dirname(os.path.abspath(__file__))
# # Construct the path to the Django project directory (adjust 'backend' as needed)
# project_dir = os.path.abspath(os.path.join(current_dir, os.pardir, 'backend'))
# import sys
# sys.path.append(project_dir)
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
# django.setup()


print("--- Starting SkillProfile Creation ---")

# Fetch existing User IDs and Category objects
try:
    user_ids = [user['id'] for user in CustomUser.objects.values('id')]
    categories = list(Category.objects.all())
    proficiencies = ['beginner', 'intermediate', 'advanced']

    if not user_ids:
        print("Error: No users found in the database.")
    if not categories:
        print("Error: No categories found in the database.")

    if user_ids and categories:
        created_profiles_count = 0
        attempts = 0
        max_attempts = 100 # Prevent infinite loop

        while created_profiles_count < 20 and attempts < max_attempts:
            user_id = random.choice(user_ids)
            category = random.choice(categories)
            # Generate a more diverse skill name potentially
            skill_name = f"Skill {random.choice(['Python', 'React', 'SQL', 'AWS', 'Marketing', 'Writing', 'Design', 'Data Analysis', 'Networking', 'Security'])} {random.randint(1, 10)}"
            proficiency = random.choice(proficiencies)
            attempts += 1 # Increment attempt counter

            # Check if this exact skill profile already exists for the user
            if not SkillProfile.objects.filter(user_id=user_id, skill=skill_name, category=category).exists():
                try:
                    profile = SkillProfile.objects.create(
                        user_id=user_id,
                        skill=skill_name,
                        category=category,
                        proficiency=proficiency
                    )
                    created_profiles_count += 1
                    print(f"({created_profiles_count}/20) Created: User {user_id}, Skill '{profile.skill}', Cat '{category.name}', Prof '{proficiency}'")
                except Exception as e:
                    # Catch potential unique_together constraint violations or other DB errors
                    print(f"Error creating profile for User {user_id}, Skill '{skill_name}', Category '{category.name}': {e}")
            # else:
                # Optional: print message if profile already exists
                # print(f"Skipped (already exists): User {user_id}, Skill '{skill_name}', Cat '{category.name}'")


        print(f"--- Finished ---")
        print(f"Successfully created {created_profiles_count} new SkillProfile instances.")
        if attempts >= max_attempts and created_profiles_count < 20:
            print(f"Stopped after {max_attempts} attempts, could not create the target of 20 unique profiles. Check existing data or increase attempts.")
        elif created_profiles_count < 20:
             print(f"Could only create {created_profiles_count} unique profiles with available data/combinations.")

except Exception as e:
    print(f"An error occurred during setup or execution: {e}") 