console.log(`Orindle backend setup checklist

1. Copy .env.example to .env.local and add only credentials you are authorized to use.
2. Create three one-time Dodo products matching Creator/Pro/Studio; do not attach Dodo credit entitlements.
3. Run npm run env:check, then npm run db:migrate and npm run db:seed against the intended database.
4. Configure Supabase Auth redirect URLs, email templates/SMTP, MFA and the separate bootstrap-admin procedure.
5. Configure the Dodo raw webhook, OPENROUTER_API_KEY, R2, Resend and JOBS_TICK_SECRET for the scheduled tick endpoint.
6. Run npm run catalog:sync to discover OpenRouter models, then approve their serving endpoints in the admin dashboard before enabling a model.
7. Keep VERCEL_DEPLOY_TARGET=preview. Production deployment and paid smoke tests require separate authorization.

No resources were created and no provider was contacted by this checklist.`);
