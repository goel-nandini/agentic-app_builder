import { Plan } from "@/types/plans";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS } from "./constant";
import { db } from "./prisma";

const getCurrentPlan = async (user?: any): Promise<Plan> => {
  try {
    const { has } = await auth();
    if (has) {
      if (has({ plan: "pro" } as any) || has({ role: "pro" } as any)) return "pro";
      if (has({ plan: "starter" } as any) || has({ role: "starter" } as any)) return "starter";
    }
  } catch (error) {
    // Ignore error if auth().has is not available in current execution context
  }

  const planFromMetadata =
    (user?.publicMetadata?.plan as Plan) ||
    (user?.unsafeMetadata?.plan as Plan);

  if (planFromMetadata === "pro" || planFromMetadata === "starter") {
    return planFromMetadata;
  }

  return "free";
};

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const currentPlan = await getCurrentPlan(user);

    const existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    const userName =
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      "User";
    const userEmail = user.emailAddresses[0]?.emailAddress || "";
    const userImage = user.imageUrl || "";

    if (existingUser) {
      if (existingUser.plan !== currentPlan) {
        const updatedCredits = existingUser.credits + PLANS[currentPlan].credits;

        return await db.user.update({
          where: {
            clerkId: user.id,
          },
          data: {
            plan: currentPlan,
            credits: updatedCredits,
            name: userName,
            email: userEmail,
            image: userImage,
          },
        });
      }

      return existingUser;
    }

    const newUser = await db.user.create({
      data: {
        clerkId: user.id,
        name: userName,
        email: userEmail,
        image: userImage,
        plan: currentPlan,
        credits: PLANS[currentPlan].credits,
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};