"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
const SignUp = () => {
  const router = useRouter();
  const [fullname, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullname,
            email,
            password,
            age,
            role,
          }),
        },
      );
      const data = await res.json();
      localStorage.setItem("token", data.token);
      // redirect user to dashboard
      if (res.ok) {
        setSuccess("User created Successfully!");
        setError("");
        setFullName("");
        setEmail("");
        setPassword("");
        setAge("");
        setRole("");
        router.push("/");
      } else {
        setError("ERROR While signing user");
        setSuccess("");
      }
    } catch (error) {
      setError("ERROR! Can't Sign up the user");
      setSuccess("");
    }
  };
  if (error || success) {
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);
  }
  return (
    <form className="form gap-2 d-flex flex-column p-5" onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-6">
          <input
            type="text"
            name="fullname"
            value={fullname}
            id="fullname"
            placeholder="Enter your Full Name"
            className="form-control"
            onChange={(e) => {
              setFullName(e.target.value);
            }}
          />
        </div>

        <div className="col-6">
          <input
            type="number"
            name="age"
            value={age}
            id="age"
            min="1"
            max="150"
            placeholder="Enter your Age"
            className="form-control"
            onChange={(e) => {
              setAge(e.target.value);
            }}
          />
        </div>
      </div>
      <input
        type="email"
        name="email"
        value={email}
        id="email"
        placeholder="Enter your email"
        className="form-control"
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />
      <input
        type="password"
        name="password"
        id="password"
        value={password}
        className="form-control"
        placeholder="Enter your password"
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <select
        name="role"
        id="role"
        value={role}
        className="form-select"
        onChange={(e) => {
          setRole(e.target.value);
        }}
      >
        <option defaultChecked>Select your Role</option>
        <option value="seller">Seller</option>
        <option value="user">Buyer</option>
      </select>
      <button type="submit" className="btn btn-primary">
        SignUp
      </button>
    </form>
  );
};

export default SignUp;
