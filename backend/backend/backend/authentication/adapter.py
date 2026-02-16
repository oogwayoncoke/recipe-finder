from allauth.account.adapter import DefaultAccountAdapter
class AccountAdapter(DefaultAccountAdapter):
  def get_email_confirmation_url(self, request, emailconfirmation):
    return f'http://localhost:5173/verify-email/{emailconfirmation.key}'
  