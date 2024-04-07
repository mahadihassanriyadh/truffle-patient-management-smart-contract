"use client";

import { Web3 } from "web3";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isAddress } from "ethers";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import provider from "../utils/web3Provider";
import patientManagementContract from "../config/patientManagementContract";
import { getAllUsers } from "../utils/users";
import { User } from "../types/userTypes";
import { useStatistics } from "../hooks/useStatistics";
import { DataTable } from "./stat-tables/data-table";
import {
    medianAgePerDistrictColumns,
    percentageOfPatientsPerAgeGroupColumns,
    regularStatColumns,
} from "./stat-tables/columns";

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
});

export function AddUserForm() {
    const [owner, setOwner] = useState<string | null>(null);
    const [connectedAccount, setConnectedAccount] = useState<string | null>(
        null
    );
    const [NewPatientAddedEvents, setNewPatientAddedEvents] = useState<any[]>(
        []
    );
    const [users, setUsers] = useState<User[]>([]);
    // total num of days since the first block was created
    const [totalDays, setTotalDays] = useState(0);
    const {
        deathRate,
        highestPatientDistrict,
        medianAgeByDistrict,
        ageGroupPercentages,
    } = useStatistics(users, totalDays);
    const [APatientIsDeadEvents, setAPatientIsDeadEvents] = useState<any[]>([]);
    const [userAdded, setUserAdded] = useState(false);
    const [userUpdated, setUserUpdated] = useState(false);

    const getOwnerAddress = async (): Promise<string> => {
        const result = (await patientManagementContract.methods
            .getOwner()
            .call()) as string;

        return result;
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            ethAddress: "",
            age: "",
        },
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(data);
        if (connectedAccount) {
            patientManagementContract.methods
                .addUser(
                    data.ethAddress,
                    data.age,
                    0,
                    0,
                    "Barishal",
                    "No Symptoms",
                    true,
                    0
                )
                .send({ from: connectedAccount || "" })
                // .on("receipt", function (receipt) {
                //     console.log(receipt.events); // All the events from the receipt
                // })
                .then(() => {
                    console.log("Success");
                    setUserAdded(true);
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

    useEffect(() => {
        getOwnerAddress().then((result: string) => {
            setOwner(result);
        });
    });

    useEffect(() => {
        const getPastEvents = async () => {
            if (patientManagementContract) {
                const events = await (
                    patientManagementContract.getPastEvents as any
                )("NewPatientAdded", {
                    fromBlock: 0,
                    toBlock: "latest",
                });

                setNewPatientAddedEvents(events);
                console.log(events);

                // consoling the times each events were emitted at
                /*
                    for (const event of events) {
                        const block = await provider.eth.getBlock(
                            event.blockNumber
                        );
                        const timestamp = block.timestamp;

                        console.log(
                            "Event emitted at",
                            new Date(Number(timestamp) * 1000)
                        );
                    }
                */

                // calculating from first block to latest
                /*
                    if (events.length > 0) {
                        // Get the timestamp of the first block
                        const firstBlock = await provider.eth.getBlock(
                            events[0].blockNumber
                        );
                        const firstTimestamp = firstBlock.timestamp;

                        // Get the timestamp of the latest block
                        const latestBlock = await provider.eth.getBlock("latest");
                        const latestTimestamp = latestBlock.timestamp;

                        // Calculate the number of days from the first block to the latest
                        const days = Math.ceil(
                            Number(latestTimestamp - firstTimestamp) /
                                (60 * 60 * 24)
                        );
                        console.log(
                            "Number of days from the first block to the latest:",
                            days
                        );
                    } 
                */

                // calculating from first block to now
                if (events.length > 0) {
                    // Get the timestamp of the first block
                    const firstBlock = await provider.eth.getBlock(
                        events[0].blockNumber
                    );
                    const firstTimestamp = firstBlock.timestamp;

                    // Get the current timestamp in seconds
                    const currentTimestamp = Math.floor(Date.now() / 1000);

                    // Calculate the number of days from the first block to the current time
                    const days = Math.ceil(
                        (currentTimestamp - Number(firstTimestamp)) /
                            (60 * 60 * 24)
                    );
                    console.log(
                        "Number of days from the first block to the current time:",
                        days
                    );
                    setTotalDays(days);
                }
            }
        };

        // Only get past events if a new user has been added
        if (userAdded || !NewPatientAddedEvents.length) {
            getPastEvents();
            // Reset userAdded to false after getting past events
            setUserAdded(false);
        }
    }, [userAdded, NewPatientAddedEvents.length]);

    // fetch users on page load
    useEffect(() => {
        async function fetchUsers() {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        }

        fetchUsers();

        if (userAdded) {
            setUserAdded(false);
        }
    }, [userAdded]);

    useEffect(() => {
        const test = Object.entries(ageGroupPercentages).map(
            ([group, percentage]) =>
                ({ group, percentage } as { group: string; percentage: number })
        );
        console.log(test);
    }, [ageGroupPercentages]);

    return (
        <>
            <div className="space-y-10 my-10">
                <div>
                    <h1 className="text-2xl text-center font-medium mb-3">
                        Death Rate & District with Highest Covid Patients
                    </h1>
                    <DataTable
                        columns={regularStatColumns}
                        data={[
                            {
                                death_rate: deathRate,
                                district: highestPatientDistrict,
                            },
                        ]}
                    />
                </div>
                <div>
                    <h1 className="text-2xl text-center font-medium mb-3">
                        Median Age By District
                    </h1>
                    <DataTable
                        columns={medianAgePerDistrictColumns}
                        data={Object.entries(medianAgeByDistrict).map(
                            ([district, age]) =>
                                ({ district, age } as {
                                    district: string;
                                    age: number;
                                })
                        )}
                    />
                </div>
                <div>
                    <h1 className="text-2xl text-center font-medium mb-3">
                        Percentage of Patients Per Age Group
                    </h1>
                    <DataTable
                        columns={percentageOfPatientsPerAgeGroupColumns}
                        data={Object.entries(ageGroupPercentages).map(
                            ([group, percentage]) =>
                                ({ group, percentage } as {
                                    group: string;
                                    percentage: number;
                                })
                        )}
                    />
                </div>
            </div>
            <h1 className="text-2xl">Owner Address: {owner}</h1>
            <h1 className="text-2xl">Connected Account: {connectedAccount}</h1>
            <h1 className="text-lg">Death Rate: {deathRate}</h1>
            <h1 className="text-lg">
                Highest Covid Patient&apos;s District: {highestPatientDistrict}
            </h1>
            {/* Median Ages By District */}
            <h1 className="text-lg">Median Ages By District:</h1>
            <ul>
                {Object.entries(medianAgeByDistrict).map(([district, age]) => (
                    <li key={district}>
                        {district}: {age}
                    </li>
                ))}
            </ul>

            {/* Percentage of Age Groups */}
            <h1 className="text-lg">Percentage of Age Groups:</h1>
            <ul>
                {Object.entries(ageGroupPercentages).map(
                    ([ageGroup, percentage]) => (
                        <li key={ageGroup}>
                            {ageGroup}: {percentage}%
                        </li>
                    )
                )}
            </ul>
            <Button
                disabled={!!connectedAccount}
                type="submit"
                onClick={connectMetamask}
            >
                {connectedAccount
                    ? "Metamask Connected ✅"
                    : "Connect to Metamask"}
            </Button>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-2/3 space-y-2"
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
                    <Button disabled={!connectedAccount} type="submit">
                        Submit
                    </Button>
                </form>
            </Form>
        </>
    );
}