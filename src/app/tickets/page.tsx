"use client";
import React, { useEffect, useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import { useAuth } from "@/components/providers/AuthProvider";
import withAuth from "@/components/providers/AuthWrapper";
import { useQRCode } from "next-qrcode";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"; // Ensure you have a Card component
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner"; // Ensure you have a LoadingSpinner component
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
} from "@/components/ui/dialog"; // Import ShadCN Dialog components

const TicketsPage = () => {
	const [registrations, setRegistrations] = useState<any[]>([]);
	const [filter, setFilter] = useState<string>("registered"); // Default filter
	const [loading, setLoading] = useState<boolean>(true); // Add loading state
	const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for the selected image
	const { isAuthenticated, handleExpiredToken } = useAuth();
	const userData = isAuthenticated
		? JSON.parse(localStorage.getItem("userData") || "{}")
		: null;

	const fetchRegistrations = async () => {
		if (!userData?.token) return;

		setLoading(true); // Start loading

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/events/registration`,
				{
					headers: {
						"X-API-KEY": process.env.NEXT_PUBLIC_API_KEY || "",
						"Content-Type": "application/json",
						Authorization: `Bearer ${userData.token}`,
					},
				}
			);

			if (response.status === 401) {
				// Handle expired token
				handleExpiredToken();
				return;
			}

			const data = await response.json();
			setRegistrations(data.data);
		} catch (error) {
			console.error("Failed to fetch registrations:", error);
		} finally {
			setLoading(false); // End loading
		}
	};

	useEffect(() => {
		fetchRegistrations();
	}, [userData?.token]);

	// Filter registrations based on selected status
	const filteredRegistrations = registrations.filter(
		(registration) => registration.status === filter
	);
	const { Image } = useQRCode();

	return (
		<>
			<HeaderNav name="Your Event Tickets" link="home" />
			<main className="p-8">
				<div className="flex flex-col mt-4 gap-y-4">
					{/* Filter buttons */}
					<div className="flex justify-center mb-4 gap-4">
						<button
							onClick={() => setFilter("registered")}
							className={`px-4 py-2 rounded ${
								filter === "registered"
									? "bg-blue-500 text-white"
									: "bg-gray-200"
							}`}
						>
							Registered
						</button>
						<button
							onClick={() => setFilter("verified")}
							className={`px-4 py-2 rounded ${
								filter === "verified"
									? "bg-green-700 text-white"
									: "bg-gray-200"
							}`}
						>
							Verified
						</button>
					</div>

					{/* Display loading spinner if loading */}
					{loading ? (
						<div className="flex justify-center items-center h-64">
							<LoadingSpinner />
						</div>
					) : (
						/* Display filtered registrations */
						<div className="flex flex-col mt-4 gap-y-8">
							{filteredRegistrations.length === 0 ? (
								<p className="text-center text-gray-500">
									No tickets available
								</p>
							) : (
								filteredRegistrations.map((registration) => (
									<Card
										key={registration.code}
										className="p-4 shadow-lg flex flex-col justify-center items-center gap-y-3 w-2/3 md:w-4/12 mx-auto text-center"
									>
										<CardTitle>{registration.name}</CardTitle>
										<CardDescription>{registration.eventName}</CardDescription>
										<Badge
											className={`flex w-17 p-2 text-center justify-center items-center mb-2 ${
												registration.status === "registered"
													? "bg-blue-500"
													: registration.status === "verified"
													? "bg-green-700"
													: "bg-gray-400" // Default color for other statuses
											}`}
										>
											<span className="mx-auto">{registration.status}</span>
										</Badge>
										<Dialog>
											<DialogTrigger asChild>
												<div
													onClick={() => setSelectedImage(registration.code)}
												>
													<Image
														text={registration.code}
														options={{
															type: "image/jpeg",
															quality: 0.8,
															errorCorrectionLevel: "M",
															margin: 3,
															scale: 10,
															width: 200,
															color: {
																dark: "#000000",
																light: "#FFFFFF",
															},
														}}
													/>
												</div>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<div className="flex flex-col items-center">
														<b>{registration.name}</b>
														<span>{registration.eventName}</span>
														<span className="text-gray-400">
															{registration.sessionName}
														</span>
													</div>
												</DialogHeader>

												{selectedImage && (
													<div className="flex justify-center">
														<Image
															text={selectedImage}
															options={{
																type: "image/jpeg",
																quality: 0.8,
																errorCorrectionLevel: "M",
																margin: 3,
																scale: 10,
																width: 600, // Larger width for display
																color: {
																	dark: "#000000",
																	light: "#FFFFFF",
																},
															}}
														/>
													</div>
												)}
												<DialogFooter>
													<span className="text-xs text-gray-500 mx-auto">
														{registration.code}
													</span>
												</DialogFooter>
											</DialogContent>
										</Dialog>
										<span className="text-xs font-light text-center">
											Click / tap the QR Code image above to expand it.
										</span>
										<Separator></Separator>
										<CardContent className="flex flex-col justify-center items-center">
											<p className="text-sm text-gray-700">
												<b>Session:</b> {registration.sessionName} (
												{registration.sessionCode})
											</p>
										</CardContent>
										{/* Additional details as needed */}
									</Card>
								))
							)}
						</div>
					)}
				</div>
			</main>
		</>
	);
};

export default withAuth(TicketsPage);