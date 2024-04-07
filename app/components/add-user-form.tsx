"use client";

import { Web3 } from "web3";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isAddress } from "ethers";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import patientManagementContract from "../config/patientManagementContract";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const FormSchema = z.object({
    ethAddress: z.custom<string>(isAddress, "Invalid Address"),
    age: z.string().refine(
        (val) => {
            const num = parseInt(val, 10);
            return !Number.isNaN(num) && num > 0;
        },
        {
            message: "Expected a positive number",
        }
    ),
    gender: z.enum(["0", "1"]).refine((value) => ["0", "1"].includes(value), {
        message: "Gender must be either '0' (Male) or '1' (Female)",
    }),
    vaccine_status: z
        .enum(["0", "1", "2"])
        .refine((value) => ["0", "1", "2"].includes(value), {
            message:
                "Vaccine status must be '0' (Not Vaccinated), '1' (One Dose), or '2' (Two Doses)",
        }),
    district: z.string().nonempty({ message: "District is required" }),
    symptoms_details: z
        .string()
        .nonempty({ message: "Symptoms details are required" }),
    is_dead: z
        .enum(["true", "false"])
        .refine((value) => ["true", "false"].includes(value), {
            message: "Is Dead must be either 'true' or 'false'",
        }),
    role: z.enum(["0", "1"]).refine((value) => ["0", "1"].includes(value), {
        message: "Role must be either '0' (Patient) or '1' (Admin)",
    }),
});

export function AddUserForm() {
    const [connectedAccount, setConnectedAccount] = useState<string | null>(
        null
    );

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            ethAddress: "",
            age: "",
            gender: "0",
            vaccine_status: "0",
            district: "",
            symptoms_details: "",
            is_dead: "false",
            role: "0",
        },
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(data);
        if (connectedAccount) {
            patientManagementContract.methods
                .addUser(
                    data.ethAddress,
                    parseInt(data.age, 10), // Convert age to number
                    parseInt(data.gender, 10), // Convert gender to number
                    parseInt(data.vaccine_status, 10), // Convert vaccine_status to number
                    data.district,
                    data.symptoms_details,
                    data.is_dead === "true", // Convert is_dead to boolean
                    parseInt(data.role, 10) // Convert role to number
                )
                .send({ from: connectedAccount || "" })
                .then(() => {
                    console.log("Success");
                })
                .catch((err: Error) => {
                    console.error(err.message);
                });
        }
    }

    async function connectMetamask() {
        //check metamask is installed
        if (window.ethereum) {
            // instantiate Web3 with the injected provider
            const web3 = new Web3(window.ethereum);

            //request user to connect accounts (Metamask will prompt)
            await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            //get the connected accounts
            const accounts = await web3.eth.getAccounts();

            //show the first connected account in the react page
            setConnectedAccount(accounts[0]);
        } else {
            alert("Please download metamask");
        }
    }

    return (
        <>
            <div className="flex justify-center my-10">
                <Button
                    disabled={!!connectedAccount}
                    type="submit"
                    onClick={connectMetamask}
                    className="space-x-2"
                    size={"lg"}
                >
                    <span className="text-2xl">
                        {connectedAccount ? "✅" : "🦊"}
                    </span>
                    <span>
                        {connectedAccount
                            ? `${connectedAccount}`
                            : "Connect to Metamask"}
                    </span>
                </Button>
            </div>
            <h3 className="text-3xl font-medium w-2/3 space-y-2 mx-auto mb-6">
                Add a Patient
            </h3>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-2/3 space-y-2 mx-auto"
                >
                    <FormField
                        control={form.control}
                        name="ethAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Eth Address"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Age"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kindly select patient's gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="0">Male</SelectItem>
                                        <SelectItem value="1">
                                            Female
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="vaccine_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vaccine Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kindly select patient's vaccine status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="0">
                                            Not Vaccinated
                                        </SelectItem>
                                        <SelectItem value="1">
                                            One Dose
                                        </SelectItem>
                                        <SelectItem value="2">
                                            Two Dose
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>District</FormLabel>
                                <FormControl>
                                    <Input placeholder="District" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="symptoms_details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Symptoms Details</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Symptoms Details"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="is_dead"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Is Dead?</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a verified email to display" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="false">
                                            No
                                        </SelectItem>
                                        <SelectItem value="true">
                                            Yes
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select Role</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a verified email to display" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="0">
                                            Patient
                                        </SelectItem>
                                        <SelectItem value="1">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        disabled={!connectedAccount}
                        type="submit"
                        size="lg"
                    >
                        Add Patient
                    </Button>
                </form>
            </Form>
        </>
    );
}
