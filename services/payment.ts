
import { User, RazorpayOptions } from "../types";
import { updateUserPlan, addAliasCredit } from "./db";

const RAZORPAY_KEY_ID = "rzp_test_RoBDa560uvI3KE";

// Load Razorpay SDK Script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const handleSubscription = async (
  user: User,
  planName: string,
  priceString: string,
  onSuccess: (updatedPlan: string) => void
) => {
  const res = await loadRazorpayScript();

  if (!res) {
    console.error("Razorpay SDK failed to load");
    return;
  }

  const numericPrice = priceString.replace(/[^0-9.]/g, '');
  const amountInPaise = Math.floor(parseFloat(numericPrice) * 100);

  if (amountInPaise === 0) {
      console.log("Free plan selected");
      return;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise, 
    currency: "INR",
    name: "EZID Platform",
    description: `Upgrade to ${planName}`,
    image: "https://via.placeholder.com/150/4f46e5/ffffff?text=EZID",
    handler: async function (response: any) {
      console.log("Payment Successful", response);
      try {
          const newPlanCode = await updateUserPlan(user.id, planName);
          onSuccess(newPlanCode);
      } catch (e) {
          console.error("Payment succeeded but database update failed", e);
      }
    },
    prefill: {
      name: user.name,
      email: user.email,
    },
    theme: {
      color: "#4f46e5",
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};

export const handleOneTimePayment = async (
    user: User,
    amountInRupees: number,
    description: string,
    onSuccess: () => void
  ) => {
    const res = await loadRazorpayScript();
    if (!res) {
      console.error("Razorpay SDK failed to load");
      return;
    }
  
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: amountInRupees * 100, // paise
      currency: "INR",
      name: "EZID Platform",
      description: description,
      image: "https://via.placeholder.com/150/4f46e5/ffffff?text=EZID",
      handler: async function (response: any) {
        console.log("One-time Payment Successful", response);
        try {
            await addAliasCredit(user.id);
            onSuccess();
        } catch (e) {
            console.error("Failed to add credit", e);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
      },
      theme: {
        color: "#4f46e5",
      },
    };
  
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
