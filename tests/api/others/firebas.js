// Using Firebase from CDN (window.firebase)

// Your Firebase configuration will go here
const firebaseConfig = {
  apiKey: "AIzaSyAL2O0MUxmRySxab1lrLZ_BdihBUGO7uAMdonal",
  authDomain: "js-project-f22e3.firebaseapp.com",
  databaseURL: "https://js-project-f22e3-default-rtdb.firebaseio.com",
  projectId: "js-project-f22e3",
  storageBucket: "js-project-f22e3.firebasestorage.app",
  messagingSenderId: "670163285438",
  appId: "1:670163285438:web:adab6692c8d5b98747f5ef",
  measurementId: "G-5N58QR5NLR",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Authentication listener
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
  } else {
    console.log("User is logged out");
  }
});

// Sign up function
export async function signup(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(`Error in signup: ${error.message}`);
  }
}

// Login function
export async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(`Error in login: ${error.message}`);
  }
}

// Logout function
export async function logout() {
  try {
    await auth.signOut();
  } catch (error) {
    throw new Error(`Error in logout: ${error.message}`);
  }
}

// Save user profile to Realtime Database
export async function saveUserProfile(uid, name, role, subject, email) {
  try {
    const userRef = db.ref(`users/${uid}`);
    await userRef.set({
      name,
      role,
      subject,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Error saving user profile: ${error.message}`);
  }
}

// Save trainer feedback data
export async function saveTrainerFeedback(trainerData) {
  try {
    const feedbackRef = db.ref("trainerFeedback");
    // Create a new entry with timestamp as key
    const newFeedbackRef = feedbackRef.push();

    await newFeedbackRef.set({
      ...trainerData,
      timestamp: new Date().toISOString(),
      submittedBy: auth.currentUser ? auth.currentUser.email : "anonymous",
    });

    return newFeedbackRef.key; // Return the unique key generated for this feedback
  } catch (error) {
    throw new Error(`Error saving trainer feedback: ${error.message}`);
  }
}

// Get all trainer feedback
export async function getAllTrainerFeedback() {
  try {
    const feedbackRef = db.ref("trainerFeedback");
    const snapshot = await feedbackRef.once("value");
    return snapshot.val();
  } catch (error) {
    throw new Error(`Error getting trainer feedback: ${error.message}`);
  }
}

// export async function getMultiTrainerQuestions() {
//   const snapshot = await db.ref("questions/multiTrainer").once("value");
//   return snapshot.val() || [];
// }

export async function getMultiTrainerQuestions() {
  try {
    const response = await fetch(
      "https://js-project-f22e3-default-rtdb.firebaseio.com/questions/multiTrainer.json"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch multi-trainer questions");
    }

    const data = await response.json();
    return data || [];
  } catch (err) {
    console.error("Error fetching questions:", err);
    return [];
  }
}


export async function updateMultiTrainerQuestions(newQuestions) {
  await db.ref("questions/multiTrainer").set(newQuestions);
}
// Export auth and database instances
export { auth, db };
