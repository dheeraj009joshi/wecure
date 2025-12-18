"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Smartphone, Building, Wallet, Shield, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const paymentMethods = [
    { id: 'card', name: 'Credit / Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'netbanking', name: 'Net Banking', icon: Building },
    { id: 'wallet', name: 'Wallet', icon: Wallet },
]

export function PaymentStep() {
    const [selectedMethod, setSelectedMethod] = useState('card')
    const [promoCode, setPromoCode] = useState('')

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Payment</h2>
                <p className="text-muted-foreground">Choose your payment method</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Select Payment Method</h3>
                    <div className="space-y-3">
                        {paymentMethods.map((method) => (
                            <Card
                                key={method.id}
                                className={cn(
                                    "cursor-pointer transition-all border-2",
                                    selectedMethod === method.id
                                        ? "border-primary ring-2 ring-primary ring-offset-2"
                                        : "border-border hover:border-primary/50"
                                )}
                                onClick={() => setSelectedMethod(method.id)}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <method.icon className="h-6 w-6 text-primary" />
                                    <span className="font-medium">{method.name}</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                    {selectedMethod === 'card' && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold mb-4">Card Details</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">Expiry Date</Label>
                                        <Input id="expiry" placeholder="MM/YY" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input id="cvv" placeholder="123" type="password" maxLength={3} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardName">Cardholder Name</Label>
                                    <Input id="cardName" placeholder="John Doe" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedMethod === 'upi' && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold mb-4">UPI Details</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="upiId">UPI ID</Label>
                                    <Input id="upiId" placeholder="yourname@upi" />
                                </div>
                                <p className="text-xs text-muted-foreground">You will receive a payment request on your UPI app</p>
                            </CardContent>
                        </Card>
                    )}

                    {selectedMethod === 'netbanking' && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold mb-4">Select Your Bank</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {['HDFC', 'ICICI', 'SBI', 'Axis'].map((bank) => (
                                        <Button key={bank} variant="outline" className="h-12">
                                            {bank}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedMethod === 'wallet' && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold mb-4">Select Wallet</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map((wallet) => (
                                        <Button key={wallet} variant="outline" className="h-12">
                                            {wallet}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Promo Code */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Enter promo code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button variant="outline">Apply</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>100% Secure Payment</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
