import firestore from "@react-native-firebase/firestore";
import { Dispatch, SetStateAction, useState } from "react";
import auth from "@react-native-firebase/auth";
import uuid from 'react-native-uuid';
import { router } from "expo-router";

export const isEmailValid = (email: string) => {
  const validRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return validRegex.test(email)
}

//! Deprecated --- needs to be updated
export const getLadder = async (setTeamData: Dispatch<SetStateAction<Array<string>>>, setIsTeamDataLoaded: Dispatch<SetStateAction<boolean>>) => {
  await firestore()
    .collection("standings")
    .doc("2023")
    .get()
    .then((res: any) => {
      setTeamData(res._data.ladder);
      setIsTeamDataLoaded(true);
    });
};

export const signOutUser = () => {
  auth().signOut()
};

export const createUserRecord = (userID: string, displayName: string, email: string) => {
  firestore()
    .collection('users')
    .doc(userID)
    .set({
      userID: userID,
      displayName: displayName,
      email: email,
      groups: [],
    }, { merge: true }).then(() => {
      console.log('user added')
    })
}

export const getCurrentRound = async (year: string, setRound: Dispatch<SetStateAction<number>>) => {
  await firestore().collection("standings").doc(`${year}`).get().then((res: any) => {
    setRound(res._data?.currentRound)
  }).catch((err) => {
    console.error(err)
  })
}

export const getFixturesForCurrentRound = async (year: string, currentRound: string, setFixtures: Dispatch<SetStateAction<number>>, setFixturesLoading: Dispatch<SetStateAction<boolean>>) => {
  setFixturesLoading(true)

  await firestore().collection('standings').doc(`${year}`).collection('rounds').doc(`${currentRound}`).get().then((res: any) => {
    const timeSortedFixtures = res._data?.roundArray.sort((a: any, b: any) => a.unixtime - b.unixtime);
    setFixtures(timeSortedFixtures)
    setFixturesLoading(false)
  }).catch((err) => {
    console.error(err)
  })
}

export const updateUserRecord = async (userID: string, recordKey: string, recordValue: any, isArray: boolean) => {
  firestore()
    .collection('users')
    .doc(userID)
    .set({
      [recordKey]: isArray ? firestore.FieldValue.arrayUnion(recordValue) : recordValue
    }, { merge: true }).then(() => {
      console.log('Record updated')
    })
}

export const getUserDetails = async (userID: string, userData: Dispatch<SetStateAction<any>>) => {
  firestore().collection('users').doc(userID).get().then((res: any) => {
    userData(res._data)
  }).catch((err) => {
    console.error(err)
  })
}

export const createGroup = async (groupData: any, isLoading?: Dispatch<SetStateAction<boolean>>) => {
  isLoading && isLoading(true)
  const groupId = uuid.v4().toString()

  //* Creates initial group record
  await firestore()
    .collection('groups').doc(groupId)
    .set({
      groupName: groupData.groupName,
      admin: auth().currentUser?.uid,
      adminName: auth().currentUser?.displayName,
      hasJoker: groupData.hasJokerRound,
      hasPerfectRound: groupData.hasPerfectRound,
      hasFinals: groupData.hasFinals,
    }, { merge: true }).then((res) => {
      console.log('group created', res)
    }).catch((err) => {
      console.error(err);
      return
    })

  //* Adds the user who created it an makes them an admin
  await firestore().collection('groups').doc(groupId).collection('users').doc(auth().currentUser?.uid).set({
    name: auth().currentUser?.displayName,
    isAdmin: true,
    tips: {

    }
  }).then((res) => {
    console.log(`user added to group ${groupData.groupName}`, res)
  }).catch((err) => {
    console.error(err);
    return
  })

  const groupObject = {
    groupName: groupData.groupName,
    groupId: groupId,
    isAdmin: true,
  }

  //* Associates the newly created group in the users collection to serve on user powered pages.
  await updateUserRecord(auth().currentUser?.uid!, 'groups', groupObject, true).then((res) => {
    console.log("Group associated with user record", res);
  }).catch((err) => {
    console.error(err);
    return
  })

  //TODO send group id as param to automatically select that tip
  //TODO when navigating back to tip screen
  router.navigate('tip')
  isLoading && isLoading(false)
}

export const getGroups = (userId: string, userGroups: Dispatch<SetStateAction<any>>) => {
  firestore().collection('users').doc(userId).get().then((res: any) => {
    userGroups(res._data.groups)
  }).catch((err) => {
    console.error(err)
  })
}

export const abbreviateTeam = (teamName: string) => {

  switch (teamName) {
    case 'Richmond':
      return 'RIC'
    case 'Carlton':
      return 'CAR'
    case 'Sydney':
      return 'SYD'
    case 'Collingwood':
      return 'COL'
    case 'Hawthorn':
      return 'HAW'
    case 'Essendon':
      return 'ESS'
    case 'Brisbane Lions':
      return 'BRI'
    case 'Fremantle':
      return 'FRE'
    case 'St Kilda':
      return 'STK'
    case 'Geelong':
      return 'GEL'
    case 'Adelaide':
      return 'ADE'
    case 'Gold Coast':
      return 'GCS'
    case 'North Melbourne':
      return 'NOR'
    case 'Greater Western Sydney':
      return 'GWS'
    case 'Western Bulldogs':
      return 'WBD'
    case 'Melbourne':
      return 'MEL'
    case 'West Coast':
      return 'WCE'
    case 'Port Adelaide':
      return 'POR'

  }
}

export const convertUnixToLocalTime = (unixTimeCode: number) => {
  //* Keep these incase we need UTC test comparisons
  // const formattedUTCTime = date.toUTCString();
  // const formattedLocalTime = date.toLocaleString();

  const date = new Date(unixTimeCode * 1000);

  const displayOptions: any = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  };


  const formattedLocalTime = date.toLocaleString('en-AU', displayOptions);
  const splitData = formattedLocalTime.replace(" at ", ",").split(',');

  return {
    matchDay: splitData[0],
    matchDate: splitData[1],
    matchTime: splitData[2],
  }
}

export const ImageFetch: any = {
  CAR: require('../assets/images/CARL.png'),
  RIC: require('../assets/images/RICH.png'),
  COL: require('../assets/images/COLL.png'),
  SYD: require('../assets/images/SYD.png'),
  ESS: require('../assets/images/ESS.png'),
  HAW: require('../assets/images/HAW.png'),
  GWS: require('../assets/images/GWS.png'),
  NOR: require('../assets/images/NMFC.png'),
  GEL: require('../assets/images/GEEL.png'),
  STK: require('../assets/images/STK.png'),
  GCS: require('../assets/images/GCFC.png'),
  ADE: require('../assets/images/ADEL.png'),
  MEL: require('../assets/images/MELB.png'),
  WBD: require('../assets/images/WB.png'),
  POR: require('../assets/images/PORT.png'),
  WCE: require('../assets/images/WCE.png'),
  FRE: require('../assets/images/FRE.png'),
  BRI: require('../assets/images/BL.png')
}

export const uploadTips = async (selectedGroup: string, round: string,) => {

}