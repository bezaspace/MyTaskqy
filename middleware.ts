import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: ["/((?!_next|api/auth|auth/signin|favicon.ico|assets|public).*)"],
};
