-- Auto-generated from content/physics-9.curriculum.json
-- Seeds FBISE Class 9 Physics (subjects → books → chapters → topics → slos → content_chunks).
-- Idempotent: re-running replaces this subject's book tree for the class. Safe to paste
-- into the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
do $$
declare
  v_json    jsonb := $hf${
  "_meta": {
    "note": "AI-drafted FBISE curriculum seed (Part B of the build spec). Per pipeline step 3, every item must be human-verified before it is shipped to students. Codes follow PHY-<class>-<chapter>.<topic>.<slo>.",
    "generated_for": "Prepify AI core learning loop demo",
    "source_basis": "FBISE Physics IX textbook + past-paper exercise questions"
  },
  "subject": "Physics",
  "track": "pre_eng",
  "class_level": 9,
  "chapters": [
    {
      "seq": 1,
      "title": "Physical Quantities and Measurement",
      "title_ur": "طبیعی مقداریں اور پیمائش",
      "topics": [
        {
          "seq": 1,
          "title": "Introduction to Physics",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-1.1.1",
              "bloom_level": "understand",
              "statement": "Define physics and identify its main branches.",
              "content_md": "## What is Physics?\n\n**Physics** is the branch of science that studies matter, energy and their mutual interactions. It explains how the physical world behaves — from the fall of an apple to the orbit of a satellite.\n\nMain branches include **mechanics** (motion and forces), **heat/thermodynamics**, **sound**, **light/optics**, **electricity and magnetism**, **atomic physics** and **nuclear physics**.\n\n**Examiner keyword:** the mark is awarded for *matter, energy and their interactions* — a vague 'study of nature' loses it."
            },
            {
              "code": "PHY-9-1.1.2",
              "bloom_level": "understand",
              "statement": "Explain the role of physics in science, technology and society.",
              "content_md": "## Why Physics Matters\n\nPhysics underpins engineering, medicine (X-rays, MRI), communication (fibre optics, mobile phones) and energy production. Advances in physics drive new technology, which in turn changes society.\n\n**Examiner keyword:** give a *specific application* (e.g. MRI, fibre optics) rather than 'it is useful'."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Physical Quantities and SI Units",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-1.2.1",
              "bloom_level": "understand",
              "statement": "Differentiate between base and derived physical quantities.",
              "content_md": "## Base vs Derived Quantities\n\nA **physical quantity** is one that can be measured. **Base quantities** are seven fundamental quantities that are not defined in terms of others: length (m), mass (kg), time (s), electric current (A), temperature (K), amount of substance (mol) and luminous intensity (cd).\n\n**Derived quantities** are obtained by combining base quantities — e.g. speed (m s⁻¹), force (kg m s⁻²), area (m²).\n\n**Examiner keyword:** name a base quantity *with its SI unit* to secure the mark."
            },
            {
              "code": "PHY-9-1.2.2",
              "bloom_level": "understand",
              "statement": "Express quantities using prefixes and scientific (standard) notation.",
              "content_md": "## Prefixes and Standard Form\n\nVery large or small numbers are written in **standard form** a × 10ⁿ where 1 ≤ a < 10. SI **prefixes** scale units: kilo (10³), centi (10⁻²), milli (10⁻³), micro (10⁻⁶), nano (10⁻⁹), mega (10⁶), giga (10⁹).\n\nExample: 3 000 000 m = 3 × 10⁶ m = 3 Mm.\n\n**Examiner keyword:** the coefficient must satisfy 1 ≤ a < 10, or the standard-form mark is lost."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Measuring Instruments",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-1.3.1",
              "bloom_level": "apply",
              "statement": "Use a vernier callipers and a screw gauge, and state their least counts.",
              "content_md": "## Vernier Callipers and Screw Gauge\n\nThe **least count** is the smallest measurement an instrument can read.\n\n* Vernier callipers: least count = 1 main-scale division ÷ number of vernier divisions = 1 mm ÷ 10 = **0.1 mm (0.01 cm)**.\n* Screw gauge: least count = pitch ÷ number of circular-scale divisions = 1 mm ÷ 100 = **0.01 mm**.\n\nReading = main-scale reading + (vernier/circular division coinciding × least count).\n\n**Examiner keyword:** always quote the least count *with units* and show the addition."
            }
          ]
        },
        {
          "seq": 4,
          "title": "Significant Figures",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-1.4.1",
              "bloom_level": "apply",
              "statement": "Identify and apply the rules of significant figures in measurements and calculations.",
              "content_md": "## Significant Figures\n\n**Significant figures** are the digits in a measurement that carry meaning. Rules: all non-zero digits are significant; zeros between non-zero digits are significant; leading zeros are not; trailing zeros after a decimal point are significant.\n\nIn multiplication/division the answer keeps the *fewest* significant figures of the data; in addition/subtraction it keeps the fewest decimal places.\n\n**Examiner keyword:** round *only at the end*, and state the number of significant figures kept."
            }
          ]
        }
      ]
    },
    {
      "seq": 2,
      "title": "Kinematics",
      "title_ur": "حرکیات",
      "topics": [
        {
          "seq": 1,
          "title": "Rest, Motion and Types of Motion",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-2.1.1",
              "bloom_level": "understand",
              "statement": "Define rest and motion and explain that they are relative.",
              "content_md": "## Rest and Motion\n\nA body is at **rest** if it does not change its position with respect to its surroundings, and in **motion** if it changes its position with respect to its surroundings, with time.\n\nRest and motion are **relative** — a passenger sitting in a moving bus is at rest relative to the bus but in motion relative to the road.\n\n**Examiner keyword:** the phrase *with respect to its surroundings (reference)* must appear."
            },
            {
              "code": "PHY-9-2.1.2",
              "bloom_level": "understand",
              "statement": "Distinguish between translatory, rotatory and vibratory motion.",
              "content_md": "## Types of Motion\n\n* **Translatory** — every particle moves along parallel paths (linear, circular or random). Example: a car on a road.\n* **Rotatory** — a body spins about a fixed axis. Example: a spinning wheel.\n* **Vibratory** — a body moves to and fro about a mean position. Example: a pendulum.\n\n**Examiner keyword:** attach a *correct example* to each type."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Scalars, Vectors and Terms of Motion",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-2.2.1",
              "bloom_level": "understand",
              "statement": "Differentiate between scalar and vector quantities and between distance and displacement.",
              "content_md": "## Scalars and Vectors\n\nA **scalar** has magnitude only (e.g. distance, speed, mass). A **vector** has both magnitude and direction (e.g. displacement, velocity, force).\n\n**Distance** is the total path length (scalar); **displacement** is the shortest straight-line distance from start to finish with direction (vector).\n\n**Examiner keyword:** displacement needs *direction* and *shortest path* to earn full marks."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Equations of Motion",
          "est_minutes": 40,
          "slos": [
            {
              "code": "PHY-9-2.3.1",
              "bloom_level": "apply",
              "statement": "Apply the three equations of uniformly accelerated motion to solve problems.",
              "content_md": "## Equations of Motion\n\nFor uniform acceleration a:\n\n* v = v₍i₎ + a t\n* S = v₍i₎ t + ½ a t²\n* 2 a S = v₍f₎² − v₍i₎²\n\nwhere v₍i₎ is initial velocity, v₍f₎ final velocity, S displacement, t time.\n\n**Examiner keyword:** always write the formula, substitute with units, then evaluate — method marks are awarded even if the final number slips."
            }
          ]
        },
        {
          "seq": 4,
          "title": "Graphs of Motion and Motion under Gravity",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-2.4.1",
              "bloom_level": "understand",
              "statement": "Interpret distance–time and speed–time graphs, and apply equations to motion under gravity.",
              "content_md": "## Graphs and Free Fall\n\nOn a **distance–time graph** the slope gives speed. On a **speed–time graph** the slope gives acceleration and the area under the line gives distance.\n\nFor a body falling freely, a = g ≈ 10 m s⁻² (near Earth). Use the equations of motion with a = g (downward positive) or a = −g (upward positive).\n\n**Examiner keyword:** state that *area under a speed–time graph = distance* — a common lost mark."
            }
          ]
        }
      ]
    },
    {
      "seq": 3,
      "title": "Dynamics",
      "title_ur": "حرکیات",
      "topics": [
        {
          "seq": 1,
          "title": "Force, Inertia and Momentum",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-3.1.1",
              "bloom_level": "understand",
              "statement": "Define force, inertia and momentum with their units.",
              "content_md": "## Force, inertia and momentum\n\nA **force** is an agency that changes or tends to change the state of rest or of uniform motion of a body. Its SI unit is the **newton (N)**.\n\n**Inertia** is the property of a body by which it resists any change in its state of rest or motion. The greater the **mass**, the greater the inertia — mass is the quantitative measure of inertia.\n\n**Momentum** is the quantity of motion of a body: **p = m v** (mass × velocity). It is a vector, and its SI unit is **kg·m·s⁻¹** (or N·s).\n\n**Examiner keyword:** momentum needs *both* mass and velocity and a direction — writing \"amount of motion\" alone loses the mark."
            },
            {
              "code": "PHY-9-3.1.2",
              "bloom_level": "apply",
              "statement": "Calculate the momentum of a moving body.",
              "content_md": "## Calculating momentum\n\nUse **p = m v**. A 2 kg ball moving at 3 m·s⁻¹ has momentum p = 2 × 3 = **6 kg·m·s⁻¹** in the direction of motion.\n\nBecause momentum is a vector, a change in *direction* (even at the same speed) is a change in momentum — this is why turning a car requires a force.\n\n**Examiner keyword:** always attach the unit **kg·m·s⁻¹** and state the direction for full marks."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Newton's Laws of Motion",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-3.2.1",
              "bloom_level": "understand",
              "statement": "State Newton's three laws of motion.",
              "content_md": "## Newton's laws of motion\n\n**First law (law of inertia):** a body continues in its state of rest or uniform motion in a straight line unless acted upon by a net external force.\n\n**Second law:** the net force on a body equals the rate of change of its momentum; for constant mass, **F = m a**. Force and acceleration are in the same direction.\n\n**Third law:** to every action there is an equal and opposite reaction, acting on *two different bodies*.\n\n**Examiner keyword:** the third-law pair acts on **two different bodies** — a common trap is to say they act on the same body (then they would cancel)."
            },
            {
              "code": "PHY-9-3.2.2",
              "bloom_level": "apply",
              "statement": "Apply F = ma to solve simple problems.",
              "content_md": "## Using F = ma\n\nRearrange as needed: **F = m a**, **a = F / m**, **m = F / a**.\n\n*Example:* a net force of 20 N on a 4 kg trolley gives a = F/m = 20/4 = **5 m·s⁻²**.\n\nRemember F is the **net (resultant)** force. If several forces act, add them (with sign) first.\n\n**Examiner keyword:** use the **net** force, not a single applied force, when friction or weight also acts."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Friction",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-3.3.1",
              "bloom_level": "understand",
              "statement": "Explain friction and methods of reducing it.",
              "content_md": "## Friction\n\n**Friction** is the force that opposes the relative motion (or tendency of motion) between two surfaces in contact. It arises from the interlocking of tiny irregularities on the surfaces.\n\nFriction can be **reduced** by polishing, lubrication (oil/grease), using ball bearings, and streamlining. It is **useful** for walking, gripping and braking, but **wastes energy** as heat and causes wear.\n\n**Examiner keyword:** friction *always opposes* relative motion — it acts opposite to the direction the body moves or tends to move."
            }
          ]
        }
      ]
    },
    {
      "seq": 4,
      "title": "Turning Effect of Forces",
      "title_ur": "قوتوں کا مروڑ اثر",
      "topics": [
        {
          "seq": 1,
          "title": "Addition and Resolution of Forces",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-4.1.1",
              "bloom_level": "understand",
              "statement": "Describe how forces are added and resolved into components.",
              "content_md": "## Adding and resolving forces\n\nForces are **vectors**: they combine by the head-to-tail rule to give a single **resultant**. Two forces acting along the same line simply add (same direction) or subtract (opposite directions).\n\nA single force can be **resolved** into two perpendicular components: **Fx = F cos θ** and **Fy = F sin θ**. This is useful for analysing forces on inclined planes and banked roads.\n\n**Examiner keyword:** the horizontal component is **F cos θ** and the vertical is **F sin θ**, where θ is measured from the horizontal."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Torque (Moment of a Force)",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-4.2.1",
              "bloom_level": "understand",
              "statement": "Define torque and state the principle of moments.",
              "content_md": "## Torque and the principle of moments\n\n**Torque (moment of a force)** is the turning effect of a force about a pivot: **τ = F × d**, where d is the perpendicular distance from the pivot to the line of action of the force. SI unit: **N·m**.\n\n**Principle of moments:** a body is in rotational equilibrium when the sum of clockwise moments equals the sum of anticlockwise moments about any point.\n\n**Examiner keyword:** d is the **perpendicular** (shortest) distance from the pivot to the force's line of action, not just any distance."
            },
            {
              "code": "PHY-9-4.2.2",
              "bloom_level": "apply",
              "statement": "Apply the principle of moments to a balanced beam.",
              "content_md": "## Balancing moments\n\nFor a beam balanced on a pivot: **F₁ d₁ = F₂ d₂**.\n\n*Example:* a 10 N weight 0.4 m left of the pivot balances a weight W at 0.5 m right: W × 0.5 = 10 × 0.4, so W = 4/0.5 = **8 N**.\n\n**Examiner keyword:** take moments **about the pivot** so the pivot's own reaction force (through the pivot) has zero moment."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Centre of Mass, Equilibrium and Stability",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-4.3.1",
              "bloom_level": "understand",
              "statement": "Explain equilibrium and the conditions for stability.",
              "content_md": "## Equilibrium and stability\n\nA body is in **equilibrium** when both conditions hold: (1) the net force is zero (translational), and (2) the net torque is zero (rotational).\n\n**Stability** improves with a **low centre of gravity** and a **wide base**. A body is stable if a vertical line through its centre of gravity falls **inside** its base; it topples when that line falls outside.\n\n**Examiner keyword:** two conditions of equilibrium — **ΣF = 0 and Στ = 0**; stating only one loses a mark."
            }
          ]
        }
      ]
    },
    {
      "seq": 5,
      "title": "Gravitation",
      "title_ur": "کششِ ثقل",
      "topics": [
        {
          "seq": 1,
          "title": "Newton's Law of Gravitation",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-5.1.1",
              "bloom_level": "understand",
              "statement": "State Newton's law of universal gravitation.",
              "content_md": "## Newton's law of gravitation\n\nEvery object attracts every other object with a force that is **directly proportional to the product of their masses** and **inversely proportional to the square of the distance** between their centres:\n\n**F = G m₁ m₂ / r²**, where **G = 6.67 × 10⁻¹¹ N·m²·kg⁻²** is the universal gravitational constant.\n\n**Examiner keyword:** the force depends on **1/r²** (inverse square) — doubling the distance makes the force one-quarter."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Mass of the Earth and Value of g",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-5.2.1",
              "bloom_level": "apply",
              "statement": "Relate g to the mass and radius of the Earth.",
              "content_md": "## Gravitational acceleration g\n\nNear the Earth's surface the gravitational force on a mass m is its weight, **W = m g**, with **g ≈ 9.8 m·s⁻²**.\n\nCombining W = mg with the law of gravitation gives **g = G M / R²**, where M and R are the mass and radius of the Earth. This shows g decreases with altitude (larger r).\n\n**Examiner keyword:** **weight = m g** and changes with location; **mass** is constant everywhere."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Artificial Satellites",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-5.3.1",
              "bloom_level": "understand",
              "statement": "Explain how artificial satellites orbit the Earth.",
              "content_md": "## Artificial satellites\n\nA **satellite** stays in orbit because gravity provides the **centripetal force** that keeps it moving in a circle. The required orbital speed for a low orbit is about **8 km·s⁻¹ (≈ 7900 m·s⁻¹)**.\n\n**Communication satellites** are placed in a **geostationary** orbit (~36,000 km up) so they complete one orbit in 24 hours and appear fixed above one point on Earth.\n\n**Examiner keyword:** gravity acts as the **centripetal force** — there is no outward \"centrifugal\" force on the satellite."
            }
          ]
        }
      ]
    },
    {
      "seq": 6,
      "title": "Work and Energy",
      "title_ur": "کام اور توانائی",
      "topics": [
        {
          "seq": 1,
          "title": "Work and Power",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-6.1.1",
              "bloom_level": "understand",
              "statement": "Define work and power with their units.",
              "content_md": "## Work and power\n\n**Work** is done when a force moves its point of application in the direction of the force: **W = F d** (or F d cos θ). SI unit: **joule (J)**; 1 J = 1 N·m.\n\n**Power** is the rate of doing work: **P = W / t**. SI unit: **watt (W)**; 1 W = 1 J·s⁻¹.\n\n**Examiner keyword:** no work is done if there is **no displacement**, or if the force is **perpendicular** to the motion (cos 90° = 0)."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Kinetic and Potential Energy",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-6.2.1",
              "bloom_level": "apply",
              "statement": "Use the formulas for kinetic and gravitational potential energy.",
              "content_md": "## Kinetic and potential energy\n\n**Kinetic energy** (energy of motion): **KE = ½ m v²**.\n\n**Gravitational potential energy** (energy of position): **PE = m g h**.\n\n*Example:* a 2 kg body at 5 m·s⁻¹ has KE = ½ × 2 × 5² = **25 J**.\n\n**Examiner keyword:** KE depends on **v²**, so doubling the speed gives **four times** the kinetic energy."
            },
            {
              "code": "PHY-9-6.2.2",
              "bloom_level": "understand",
              "statement": "State the law of conservation of energy.",
              "content_md": "## Conservation of energy\n\n**Energy can neither be created nor destroyed; it only changes from one form to another.** The total energy of an isolated system stays constant.\n\nA falling body converts PE into KE; a pendulum swaps PE and KE back and forth. In real systems some energy is \"lost\" to heat through friction — but it is not destroyed, only dispersed.\n\n**Examiner keyword:** energy is **transformed**, not used up; state that total energy remains **constant**."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Efficiency and Sources of Energy",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-6.3.1",
              "bloom_level": "understand",
              "statement": "Define efficiency and distinguish renewable and non-renewable sources.",
              "content_md": "## Efficiency and energy sources\n\n**Efficiency** = (useful energy output ÷ total energy input) × 100%. No machine is 100% efficient because some energy always becomes heat through friction.\n\n**Renewable** sources (solar, wind, hydro, biomass, geothermal) are replenished naturally; **non-renewable** sources (coal, oil, gas, nuclear fuel) run out and often pollute.\n\n**Examiner keyword:** efficiency is always **less than 100%**; the \"lost\" energy is mostly **heat due to friction**."
            }
          ]
        }
      ]
    },
    {
      "seq": 7,
      "title": "Properties of Matter",
      "title_ur": "مادے کی خصوصیات",
      "topics": [
        {
          "seq": 1,
          "title": "Kinetic Molecular Model and States of Matter",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-7.1.1",
              "bloom_level": "understand",
              "statement": "Describe the states of matter using the kinetic molecular model.",
              "content_md": "## Kinetic molecular model\n\nAll matter is made of tiny particles in constant motion. In a **solid** particles vibrate about fixed positions (fixed shape and volume); in a **liquid** they slide past one another (fixed volume, no fixed shape); in a **gas** they move freely and fill the container (no fixed shape or volume).\n\nHeating increases the particles' kinetic energy, which is why solids melt and liquids evaporate.\n\n**Examiner keyword:** name the property that changes — **shape and/or volume** — for each state."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Density and Pressure",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-7.2.1",
              "bloom_level": "apply",
              "statement": "Calculate density and pressure.",
              "content_md": "## Density and pressure\n\n**Density** = mass ÷ volume: **ρ = m / V** (SI unit **kg·m⁻³**).\n\n**Pressure** = force ÷ area: **P = F / A** (SI unit **pascal, Pa**; 1 Pa = 1 N·m⁻²). A smaller area under the same force gives a larger pressure — this is why a sharp knife cuts well.\n\n**Examiner keyword:** pressure is **force per unit area**; the same force on a **smaller area** gives **greater** pressure."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Pressure in Liquids: Pascal, Archimedes and Floatation",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-7.3.1",
              "bloom_level": "understand",
              "statement": "State Pascal's law, Archimedes' principle and the principle of floatation.",
              "content_md": "## Liquids: Pascal, Archimedes, floatation\n\n**Pascal's law:** pressure applied to an enclosed liquid is transmitted equally in all directions (basis of the hydraulic press/brakes).\n\n**Archimedes' principle:** an object wholly or partly immersed in a fluid experiences an **upthrust equal to the weight of the fluid it displaces**.\n\n**Principle of floatation:** a floating body displaces its **own weight** of fluid.\n\n**Examiner keyword:** upthrust equals the **weight of fluid displaced** — not the weight of the object."
            }
          ]
        },
        {
          "seq": 4,
          "title": "Elasticity and Hooke's Law",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-7.4.1",
              "bloom_level": "understand",
              "statement": "State Hooke's law and define elastic limit.",
              "content_md": "## Elasticity and Hooke's law\n\n**Hooke's law:** within the elastic limit, the extension of a spring is **directly proportional** to the load applied: **F = k x**, where k is the spring constant.\n\nBeyond the **elastic limit** the body does not return to its original shape — the deformation becomes permanent.\n\n**Examiner keyword:** Hooke's law holds **only within the elastic limit**; state this condition for the mark."
            }
          ]
        }
      ]
    },
    {
      "seq": 8,
      "title": "Thermal Properties of Matter",
      "title_ur": "مادے کی حرارتی خصوصیات",
      "topics": [
        {
          "seq": 1,
          "title": "Temperature and Heat",
          "est_minutes": 30,
          "slos": [
            {
              "code": "PHY-9-8.1.1",
              "bloom_level": "understand",
              "statement": "Distinguish between heat and temperature.",
              "content_md": "## Heat and temperature\n\n**Temperature** is the degree of hotness or coldness of a body and decides the direction of heat flow; it is measured in **°C** or **kelvin (K)**, with **T(K) = T(°C) + 273**.\n\n**Heat** is energy that flows from a hotter to a colder body because of the temperature difference; it is measured in **joules (J)**.\n\n**Examiner keyword:** heat is **energy in transit** (J); temperature is a **measure of hotness** (K) — do not treat them as the same quantity."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Thermal Expansion",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-8.2.1",
              "bloom_level": "understand",
              "statement": "Explain thermal expansion of solids, liquids and gases with examples.",
              "content_md": "## Thermal expansion\n\nMost substances **expand on heating** because their particles vibrate more and move apart. Gaps in railway lines and bridges allow for this expansion.\n\nA **bimetallic strip** bends when heated because the two metals expand by different amounts — used in thermostats and fire alarms.\n\n**Examiner keyword:** expansion happens because particles gain **kinetic energy** and move **farther apart**, not because the particles themselves grow."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Specific Heat Capacity and Latent Heat",
          "est_minutes": 35,
          "slos": [
            {
              "code": "PHY-9-8.3.1",
              "bloom_level": "apply",
              "statement": "Use Q = m c ΔT and explain latent heat.",
              "content_md": "## Specific heat and latent heat\n\n**Specific heat capacity (c)** is the heat needed to raise the temperature of 1 kg of a substance by 1 K: **Q = m c ΔT**.\n\n**Latent heat** is the heat absorbed or released during a **change of state** at constant temperature (melting/freezing, boiling/condensing).\n\nWater's high specific heat (**4200 J·kg⁻¹·K⁻¹**) makes it a good coolant and moderates climate.\n\n**Examiner keyword:** during a change of state the **temperature stays constant** while latent heat is absorbed/released."
            }
          ]
        }
      ]
    },
    {
      "seq": 9,
      "title": "Transfer of Heat",
      "title_ur": "حرارت کی منتقلی",
      "topics": [
        {
          "seq": 1,
          "title": "Conduction",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-9.1.1",
              "bloom_level": "understand",
              "statement": "Explain conduction and compare conductors and insulators.",
              "content_md": "## Conduction\n\n**Conduction** is the transfer of heat through a material **without the particles themselves moving from place to place** — energy passes from vibrating particle to neighbour, and in metals mainly by free electrons.\n\n**Metals** are good conductors; **wood, air, water and plastics** are poor conductors (insulators).\n\n**Examiner keyword:** in conduction the particles **vibrate in place** and pass energy on — they do **not** travel with the heat."
            }
          ]
        },
        {
          "seq": 2,
          "title": "Convection",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-9.2.1",
              "bloom_level": "understand",
              "statement": "Explain convection in fluids with everyday examples.",
              "content_md": "## Convection\n\n**Convection** is the transfer of heat in **fluids (liquids and gases)** by the actual movement of the heated particles. Warm fluid becomes less dense and rises, cooler fluid sinks, setting up a **convection current**.\n\nSea breezes, room heating and boiling water all work by convection.\n\n**Examiner keyword:** convection needs a **fluid** and works because warm fluid is **less dense and rises**."
            }
          ]
        },
        {
          "seq": 3,
          "title": "Radiation and Applications",
          "est_minutes": 25,
          "slos": [
            {
              "code": "PHY-9-9.3.1",
              "bloom_level": "understand",
              "statement": "Explain radiation and everyday applications of heat transfer.",
              "content_md": "## Radiation\n\n**Radiation** is the transfer of heat by **electromagnetic waves** and needs **no material medium** — this is how the Sun's heat reaches the Earth through empty space.\n\n**Dull black** surfaces are good emitters and absorbers of radiation; **shiny/white** surfaces reflect it. This is used in the **thermos flask**, which reduces all three transfers to keep contents hot or cold.\n\n**Examiner keyword:** radiation requires **no medium**; a **dull black** surface is the best absorber and emitter."
            }
          ]
        }
      ]
    }
  ]
}
$hf$::jsonb;
  v_class   int   := (v_json->>'class_level')::int;
  v_subject uuid;
  v_book    uuid;
  v_chapter uuid;
  v_topic   uuid;
  v_slo     uuid;
  ch jsonb; tp jsonb; sl jsonb;
begin
  select id into v_subject from subjects where name = v_json->>'subject';
  if v_subject is null then
    insert into subjects(name, track) values (v_json->>'subject', v_json->>'track') returning id into v_subject;
  else
    update subjects set track = coalesce(subjects.track, v_json->>'track') where id = v_subject;
  end if;

  delete from books where subject_id = v_subject and class_level = v_class;
  insert into books(subject_id, class_level, edition)
    values (v_subject, v_class, 'FBISE') returning id into v_book;

  for ch in select jsonb_array_elements(v_json->'chapters') loop
    insert into chapters(book_id, seq, title, title_ur)
      values (v_book, (ch->>'seq')::int, ch->>'title', ch->>'title_ur')
      returning id into v_chapter;

    for tp in select jsonb_array_elements(ch->'topics') loop
      insert into topics(chapter_id, seq, title, est_minutes)
        values (v_chapter, (tp->>'seq')::int, tp->>'title', coalesce((tp->>'est_minutes')::int, 20))
        returning id into v_topic;

      for sl in select jsonb_array_elements(tp->'slos') loop
        insert into slos(topic_id, code, statement, bloom_level)
          values (v_topic, sl->>'code', sl->>'statement', sl->>'bloom_level')
          returning id into v_slo;

        insert into content_chunks(slo_id, seq, content_md, token_count)
          values (v_slo, 1, sl->>'content_md',
                  ceil(coalesce(array_length(regexp_split_to_array(trim(coalesce(sl->>'content_md','')), '\s+'), 1), 0) * 1.3)::int);
      end loop;
    end loop;
  end loop;

  raise notice 'Seeded Physics: % chapters', jsonb_array_length(v_json->'chapters');
end $$;
