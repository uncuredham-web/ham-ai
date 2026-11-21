interface LabUser {
  name: string;
  role: string;
}

const expert: LabUser = {
  name: "はむ",
  role: "Lead Developer"
};

console.log(`Welcome to Ham Lab, ${expert.role} ${expert.name}さん！`);