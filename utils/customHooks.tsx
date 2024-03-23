import { useState, useEffect, SetStateAction } from "react";
import auth from "@react-native-firebase/auth";
import { destructureGroupData, getUserDetails } from "./utils";
import firestore from "@react-native-firebase/firestore";
import { TUserRecord } from "./types";

export function useCurrentUser(selectedGroup?: string, selectedRound?: any) {
  const [user, setUser] = useState<TUserRecord | null>(null);
  const userDocRef = firestore()
    .collection("users")
    .doc(auth().currentUser?.uid!);
  const userGroupsCollectionRef = userDocRef.collection("groups");
  const selectedGroupTipRef = userGroupsCollectionRef
    .doc(selectedGroup)
    .collection("tips")
    .doc(`${selectedRound}`);

  //* Update user if they are authorised, clear user if not.
  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((currentUser) => {
      if (currentUser) {
        getUserDetails(currentUser.uid, setUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, [auth().currentUser]);

  //* Update user record as soon as value is updated in Firestore Database
  useEffect(() => {
    //* Check if user is authenticate to listen for DB changes.
    if (auth().currentUser) {
      const unsubscribeFirestore = userDocRef.onSnapshot(
        async (snapshot) => {
          //* Gets users top level data
          const data = snapshot.data() as Partial<TUserRecord>;

          user &&
            setUser({
              ...(user as TUserRecord),
              email: data.email!,
              displayName: data.displayName!,
              userID: data.userID!,
            });
        },
        (error) => console.error(error)
      );

      return () => unsubscribeFirestore();
    }
  }, [auth().currentUser]);

  //! May be room to put this into its own custom hook to keep tip data and
  //! user data decoupled
  //* Updates when tips are changed for specific group
  useEffect(() => {
    //* Check if user is authenticate to listen for DB changes.
    if (auth().currentUser) {
      const unsubscribeFirestore = selectedGroupTipRef.onSnapshot(
        async (snapshot) => {
          //* Grabs group collection data from user
          const groupObject = await destructureGroupData();

          user &&
            setUser({
              ...(user as TUserRecord),
              groups: groupObject,
            });
        },
        (error) => console.error(error)
      );

      return () => unsubscribeFirestore();
    }
  }, [auth().currentUser, selectedGroup, selectedRound]);

  return user;
}
