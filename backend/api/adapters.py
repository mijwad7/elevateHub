from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        email = sociallogin.email_addresses[0].email if sociallogin.email_addresses else None
        if email:
            try:
                user = User.objects.get(email=email)
                sociallogin.connect(request, user)
            except User.DoesNotExist:
                user = User(email=email, username=email.split("@")[0])
                user.set_unusable_password()
                sociallogin.save(request)
                sociallogin.user = user
                user.save()

    def get_signup_form_class(self, request, sociallogin):
        return None