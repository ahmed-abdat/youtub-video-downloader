import { app } from "@/config/firebase";
import { TFormSchema } from "@/lib/validations/coming-soon-email";
import {
  collection,
  getFirestore,
  addDoc,
  serverTimestamp,
  where,
  query,
  getDocs,
} from "firebase/firestore/lite";


const firestore = getFirestore(app);

export const sotreNotifyEmail = async (email: TFormSchema) => {
  const notifyRef = collection(firestore, "notify-email");
  await addDoc(notifyRef, {
    email : email.email,
    createdAt: serverTimestamp(),
  });
}

export const isEmailExist = async (email: string) => {
  const notifyRef = collection(firestore, "notify-email");
  const q = query(notifyRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size > 0;
}