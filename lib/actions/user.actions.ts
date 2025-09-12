"use server";

import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
    const {databases } = await createAdminClient();
    try{
    const result = await databases.listDocuments(
        appwriteConfig.databaseId, 
        appwriteConfig.usersCollectionId, 
        [Query.equal("email", [email])],
    );
    return result.total > 0 ? result.documents[0] : null;
    } catch (error) {
        handleError(error, 'Failed to get user by email');
    }
}
const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};
const sendEmailOTP = async ({email} : { email: string }) => {
    const { account } = await createAdminClient();
    try {
        const session = await account.createEmailToken(ID.unique(), email);
        return session.$id;
    } catch (error) {
        handleError(error, 'Failed to send email OTP');
    }
}
export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: '',
        accountId,
      },
    );
  }

  return parseStringify({ accountId });
};




