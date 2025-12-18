import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export function FilterSidebar() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button variant="ghost" className="text-sm text-primary h-auto p-0 hover:bg-transparent">Reset</Button>
            </div>

            <Accordion type="multiple" defaultValue={["specialty", "availability", "fee"]} className="w-full">
                {/* Specialty */}
                <AccordionItem value="specialty">
                    <AccordionTrigger>Specialty</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            {["Cardiology", "Dermatology", "Neurology", "Orthopedics", "General Medicine"].map((spec) => (
                                <div key={spec} className="flex items-center space-x-2">
                                    <Checkbox id={spec} />
                                    <Label htmlFor={spec} className="text-sm font-normal cursor-pointer">{spec}</Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Consultation Type */}
                <AccordionItem value="type">
                    <AccordionTrigger>Consultation Type</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="video" />
                                <Label htmlFor="video" className="text-sm font-normal">Video Call</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="in-person" />
                                <Label htmlFor="in-person" className="text-sm font-normal">In-Person Visit</Label>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Availability */}
                <AccordionItem value="availability">
                    <AccordionTrigger>Availability</AccordionTrigger>
                    <AccordionContent>
                        <RadioGroup defaultValue="any">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="today" id="today" />
                                <Label htmlFor="today" className="text-sm font-normal">Available Today</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="tomorrow" id="tomorrow" />
                                <Label htmlFor="tomorrow" className="text-sm font-normal">Available Tomorrow</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="week" id="week" />
                                <Label htmlFor="week" className="text-sm font-normal">Next 7 Days</Label>
                            </div>
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>

                {/* Fee Range */}
                <AccordionItem value="fee">
                    <AccordionTrigger>Consultation Fee</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            <Slider defaultValue={[1000]} max={5000} step={100} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>₹0</span>
                                <span>₹5000+</span>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Gender */}
                <AccordionItem value="gender">
                    <AccordionTrigger>Gender</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="male" />
                                <Label htmlFor="male" className="text-sm font-normal">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="female" />
                                <Label htmlFor="female" className="text-sm font-normal">Female</Label>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
