interface User {
  name: string;
  role: string;
}

const admin: User = {
  name: "はむ",
  role: "Developer"
};

console.log(`Welcome, ${admin.name}さん!`);