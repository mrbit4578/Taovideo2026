// Platform-owned by Type. Lets this app's Convex backend verify
// Type-authorized viewers through ctx.auth.getUserIdentity(). Do not edit or delete.
export default {
  providers: [
    {
      type: "customJwt",
      issuer: "https://api.type.com/api/type-app-auth",
      jwks: "https://api.type.com/api/type-app-auth/jwks.json",
      algorithm: "RS256",
      applicationID: "DIRECTOR_STUDIO_TYPE_APP_NOT_CONFIGURED",
    },
  ],
};
