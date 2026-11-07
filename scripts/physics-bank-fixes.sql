-- ---------------------------------------------------------------------------
-- Physics chapters 1-3: bank fixes that go with the Physics mock pool.
--
-- * Restores five stems the first parser cut to their last line ("This means
--   it can measure:", "The volume of the stone is:", ...) from the Unit 1 and
--   Unit 3 files, and writes 1 kg⋅m/s² properly in one question's options.
-- * Re-sorts which questions are scenario-based (category), so a mock paper's
--   one-in-three scenario share draws on real scenario questions.
--
-- Run before the Physics mock batches in scripts/mcq-bank-sql/: those match
-- rows by exact text, so the stems must already be fixed. Re-runnable, and it
-- changes rows in place, so question ids (and past tests) are untouched.
-- ---------------------------------------------------------------------------
do $$
declare
  n int := 0;
  k int;
begin
  update questions q set stem_md = $q$The SI unit of luminous intensity is$q$, options_json = $q$["Newton", "Kelvin", "Kilogram", "Candela"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The SI unit of luminous intensity is$q$ and q.options_json = $q$["Newton", "Kelvin", "Kilogram", "Candela"]$q$::jsonb)
       or (q.stem_md = $q$The SI unit of luminous intensity is$q$ and q.options_json = $q$["Newton", "Kelvin", "Kilogram", "Candela"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$What is the name of unit written as MW$q$, options_json = $q$["Milli watt", "Mega watt", "Million watt", "Kilowatt"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$What is the name of unit written as MW$q$ and q.options_json = $q$["Milli watt", "Mega watt", "Million watt", "Kilowatt"]$q$::jsonb)
       or (q.stem_md = $q$What is the name of unit written as MW$q$ and q.options_json = $q$["Milli watt", "Mega watt", "Million watt", "Kilowatt"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The upper jaws of vernier caliper is used to calculate$q$, options_json = $q$["Volume", "Internal diameter", "External diameter", "Area"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The upper jaws of vernier caliper is used to calculate$q$ and q.options_json = $q$["Volume", "Internal diameter", "External diameter", "Area"]$q$::jsonb)
       or (q.stem_md = $q$The upper jaws of vernier caliper is used to calculate$q$ and q.options_json = $q$["Volume", "Internal diameter", "External diameter", "Area"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The most precise device in vernier caliper and screw Gauge is$q$, options_json = $q$["Screw Gauge", "Vernier caliper", "Both", "None"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The most precise device in vernier caliper and screw Gauge is$q$ and q.options_json = $q$["Screw Gauge", "Vernier caliper", "Both", "None"]$q$::jsonb)
       or (q.stem_md = $q$The most precise device in vernier caliper and screw Gauge is$q$ and q.options_json = $q$["Screw Gauge", "Vernier caliper", "Both", "None"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The doubts present in our measurements is known as$q$, options_json = $q$["Precision", "Accuracy", "Errors", "Significant digits"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The doubts present in our measurements is known as$q$ and q.options_json = $q$["Precision", "Accuracy", "Errors", "Significant digits"]$q$::jsonb)
       or (q.stem_md = $q$The doubts present in our measurements is known as$q$ and q.options_json = $q$["Precision", "Accuracy", "Errors", "Significant digits"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The least count for digital stop watch is$q$, options_json = $q$["1s", "0.1s", "0.01s", "0.001s"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The least count for digital stop watch is$q$ and q.options_json = $q$["1s", "0.1s", "0.01s", "0.001s"]$q$::jsonb)
       or (q.stem_md = $q$The least count for digital stop watch is$q$ and q.options_json = $q$["1s", "0.1s", "0.01s", "0.001s"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Measuring cylinder is used to calculate$q$, options_json = $q$["Length", "Volume", "Area", "Mass"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Measuring cylinder is used to calculate$q$ and q.options_json = $q$["Length", "Volume", "Area", "Mass"]$q$::jsonb)
       or (q.stem_md = $q$Measuring cylinder is used to calculate$q$ and q.options_json = $q$["Length", "Volume", "Area", "Mass"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which type of quantity momentum is$q$, options_json = $q$["Vector", "Scalar", "Base", "Non physical"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Which type of quantity momentum is$q$ and q.options_json = $q$["Vector", "Scalar", "Base", "Non physical"]$q$::jsonb)
       or (q.stem_md = $q$Which type of quantity momentum is$q$ and q.options_json = $q$["Vector", "Scalar", "Base", "Non physical"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Quantity that represent with letter and arrow head over it is$q$, options_json = $q$["Base", "Derived", "Scalar", "Vector"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Quantity that represent with letter and arrow head over it is$q$ and q.options_json = $q$["Base", "Derived", "Scalar", "Vector"]$q$::jsonb)
       or (q.stem_md = $q$Quantity that represent with letter and arrow head over it is$q$ and q.options_json = $q$["Base", "Derived", "Scalar", "Vector"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The proper way to represent vectors is$q$, options_json = $q$["Sketch", "Graph", "Multiplication", "Subtraction"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The proper way to represent vectors is$q$ and q.options_json = $q$["Sketch", "Graph", "Multiplication", "Subtraction"]$q$::jsonb)
       or (q.stem_md = $q$The proper way to represent vectors is$q$ and q.options_json = $q$["Sketch", "Graph", "Multiplication", "Subtraction"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The rule used to calculate the sum of vectors is$q$, options_json = $q$["Subtraction", "Graphical analysis", "Head to tail rule", "Cramer's rule"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The rule used to calculate the sum of vectors is$q$ and q.options_json = $q$["Subtraction", "Graphical analysis", "Head to tail rule", "Cramer's rule"]$q$::jsonb)
       or (q.stem_md = $q$The rule used to calculate the sum of vectors is$q$ and q.options_json = $q$["Subtraction", "Graphical analysis", "Head to tail rule", "Cramer's rule"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The frame of reference that describe the position of point or object$q$, options_json = $q$["Origin system", "Coordinate system", "SI system", "None of these"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The frame of reference that describe the position of point or object$q$ and q.options_json = $q$["Origin system", "Coordinate system", "SI system", "None of these"]$q$::jsonb)
       or (q.stem_md = $q$The frame of reference that describe the position of point or object$q$ and q.options_json = $q$["Origin system", "Coordinate system", "SI system", "None of these"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A meter ruler has 100 cm divisions.Each centimeter is further subdivided into$q$, options_json = $q$["1 millimeters", "10 millimeters", "50 millimeters", "100 millimeters"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$A meter ruler has 100 cm divisions.Each centimeter is further subdivided into$q$ and q.options_json = $q$["1 millimeters", "10 millimeters", "50 millimeters", "100 millimeters"]$q$::jsonb)
       or (q.stem_md = $q$A meter ruler has 100 cm divisions.Each centimeter is further subdivided into$q$ and q.options_json = $q$["1 millimeters", "10 millimeters", "50 millimeters", "100 millimeters"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The prefix tera is equal to$q$, options_json = $q$["10¹²", "10¹⁰", "10¹⁵", "10¹⁶"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The prefix tera is equal to$q$ and q.options_json = $q$["10¹²", "10¹⁰", "10¹⁵", "10¹⁶"]$q$::jsonb)
       or (q.stem_md = $q$The prefix tera is equal to$q$ and q.options_json = $q$["10¹²", "10¹⁰", "10¹⁵", "10¹⁶"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$We use measuring cylinder to calculate volume. Which method is used in it?$q$, options_json = $q$["Head to tail", "Displacement", "Scalar", "Significant digits"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$We use measuring cylinder to calculate volume. Which method is used in it?$q$ and q.options_json = $q$["Head to tail", "Displacement", "Scalar", "Significant digits"]$q$::jsonb)
       or (q.stem_md = $q$We use measuring cylinder to calculate volume. Which method is used in it?$q$ and q.options_json = $q$["Head to tail", "Displacement", "Scalar", "Significant digits"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Measured and exact values are the types of$q$, options_json = $q$["Measurements", "Scalar", "Errors", "Vectors"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Measured and exact values are the types of$q$ and q.options_json = $q$["Measurements", "Scalar", "Errors", "Vectors"]$q$::jsonb)
       or (q.stem_md = $q$Measured and exact values are the types of$q$ and q.options_json = $q$["Measurements", "Scalar", "Errors", "Vectors"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which type of error is removed by calibration of an instrument$q$, options_json = $q$["Random", "Systematic", "Personal", "External"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Which type of error is removed by calibration of an instrument$q$ and q.options_json = $q$["Random", "Systematic", "Personal", "External"]$q$::jsonb)
       or (q.stem_md = $q$Which type of error is removed by calibration of an instrument$q$ and q.options_json = $q$["Random", "Systematic", "Personal", "External"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$For scientific notation international accepted practice is that their should be how many digits before the decimal point$q$, options_json = $q$["Two", "Three", "Four", "One"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$For scientific notation international accepted practice is that their should be how many digits before the decimal point$q$ and q.options_json = $q$["Two", "Three", "Four", "One"]$q$::jsonb)
       or (q.stem_md = $q$For scientific notation international accepted practice is that their should be how many digits before the decimal point$q$ and q.options_json = $q$["Two", "Three", "Four", "One"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The term used internationally for multiples and submultiples of various units are known as$q$, options_json = $q$["Standard", "Scientific notation", "Prefixes", "All of above"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The term used internationally for multiples and submultiples of various units are known as$q$ and q.options_json = $q$["Standard", "Scientific notation", "Prefixes", "All of above"]$q$::jsonb)
       or (q.stem_md = $q$The term used internationally for multiples and submultiples of various units are known as$q$ and q.options_json = $q$["Standard", "Scientific notation", "Prefixes", "All of above"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Separation between division on the vernier scale of vernier caliper is$q$, options_json = $q$["1cm", "1mm", "0.9mm", "All of them"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Separation between division on the vernier scale of vernier caliper is$q$ and q.options_json = $q$["1cm", "1mm", "0.9mm", "All of them"]$q$::jsonb)
       or (q.stem_md = $q$Separation between division on the vernier scale of vernier caliper is$q$ and q.options_json = $q$["1cm", "1mm", "0.9mm", "All of them"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which type of error is often described as 'bias'$q$, options_json = $q$["Random", "Systematic", "Measurement", "Human"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Which type of error is often described as 'bias'$q$ and q.options_json = $q$["Random", "Systematic", "Measurement", "Human"]$q$::jsonb)
       or (q.stem_md = $q$Which type of error is often described as 'bias'$q$ and q.options_json = $q$["Random", "Systematic", "Measurement", "Human"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A digital vernier caliper has a least count of 0.01 mm. This means it can measure:$q$, options_json = $q$["Only whole millimetres", "Up to 0.1 mm", "Up to 0.01 mm", "Up to 1 mm"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$This means it can measure:$q$ and q.options_json = $q$["Only whole millimetres", "Up to 0.1 mm", "Up to 0.01 mm", "Up to 1 mm"]$q$::jsonb)
       or (q.stem_md = $q$A digital vernier caliper has a least count of 0.01 mm. This means it can measure:$q$ and q.options_json = $q$["Only whole millimetres", "Up to 0.1 mm", "Up to 0.01 mm", "Up to 1 mm"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A measuring cylinder contains 40 cm³ of water. After a stone is fully immersed, the reading becomes 55 cm³. The volume of the stone is:$q$, options_json = $q$["15 cm³", "40 cm³", "55 cm³", "95 cm³"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$The volume of the stone is:$q$ and q.options_json = $q$["15 cm³", "40 cm³", "55 cm³", "95 cm³"]$q$::jsonb)
       or (q.stem_md = $q$A measuring cylinder contains 40 cm³ of water. After a stone is fully immersed, the reading becomes 55 cm³. The volume of the stone is:$q$ and q.options_json = $q$["15 cm³", "40 cm³", "55 cm³", "95 cm³"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A student measures the time for one oscillation of a pendulum. To reduce random error, he should:$q$, options_json = $q$["Measure one oscillation only.", "Measure many oscillations and find the average.", "Use a larger pendulum.", "Use a ruler."]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$To reduce random error, he should:$q$ and q.options_json = $q$["Measure one oscillation only.", "Measure many oscillations and find the average.", "Use a larger pendulum.", "Use a ruler."]$q$::jsonb)
       or (q.stem_md = $q$A student measures the time for one oscillation of a pendulum. To reduce random error, he should:$q$ and q.options_json = $q$["Measure one oscillation only.", "Measure many oscillations and find the average.", "Use a larger pendulum.", "Use a ruler."]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A scale always shows 0.2 kg more than the true value. This is an example of:$q$, options_json = $q$["Random error", "Systematic error", "Human error", "Percentage error"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$A scale always shows 0.2 kg more than the true value. This is an example of:$q$ and q.options_json = $q$["Random error", "Systematic error", "Human error", "Percentage error"]$q$::jsonb)
       or (q.stem_md = $q$A scale always shows 0.2 kg more than the true value. This is an example of:$q$ and q.options_json = $q$["Random error", "Systematic error", "Human error", "Percentage error"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A wire has a diameter of 2000 μm. Its diameter in millimetres is:$q$, options_json = $q$["0.2 mm", "2 mm", "20 mm", "200 mm"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$Its diameter in millimeters is:$q$ and q.options_json = $q$["0.2 mm", "2 mm", "20 mm", "200 mm"]$q$::jsonb)
       or (q.stem_md = $q$A wire has a diameter of 2000 μm. Its diameter in millimetres is:$q$ and q.options_json = $q$["0.2 mm", "2 mm", "20 mm", "200 mm"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A quantity is measured in m/s. This quantity is most likely:$q$, options_json = $q$["Base quantity", "Derived quantity", "Non-physical quantity", "Fundamental quantity"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$This quantity is most likely:$q$ and q.options_json = $q$["Base quantity", "Derived quantity", "Non-physical quantity", "Fundamental quantity"]$q$::jsonb)
       or (q.stem_md = $q$A quantity is measured in m/s. This quantity is most likely:$q$ and q.options_json = $q$["Base quantity", "Derived quantity", "Non-physical quantity", "Fundamental quantity"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A measurement taken with a vernier caliper is 6.24 cm. If the main scale reading is 6.2 cm, the coinciding vernier division is:$q$, options_json = $q$["2nd", "4th", "24th", "6th"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 1 and q.source = 'bank'
     and ((q.stem_md = $q$A measurement taken with a vernier caliper is 6.24 cm. If the main scale reading is 6.2 cm, the coinciding vernier division is:$q$ and q.options_json = $q$["2nd", "4th", "24th", "6th"]$q$::jsonb)
       or (q.stem_md = $q$A measurement taken with a vernier caliper is 6.24 cm. If the main scale reading is 6.2 cm, the coinciding vernier division is:$q$ and q.options_json = $q$["2nd", "4th", "24th", "6th"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$An object is changing its position with respect to its surrounding which property explains this$q$, options_json = $q$["Heat", "Light", "Atomic", "Mechanics"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$An object is changing its position with respect to its surrounding which property explains this$q$ and q.options_json = $q$["Heat", "Light", "Atomic", "Mechanics"]$q$::jsonb)
       or (q.stem_md = $q$An object is changing its position with respect to its surrounding which property explains this$q$ and q.options_json = $q$["Heat", "Light", "Atomic", "Mechanics"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Study of motion without discussing the cause of motion is called$q$, options_json = $q$["Kinematics", "Dynamics", "Heat", "Motion"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$Study of motion without discussing the cause of motion is called$q$ and q.options_json = $q$["Kinematics", "Dynamics", "Heat", "Motion"]$q$::jsonb)
       or (q.stem_md = $q$Study of motion without discussing the cause of motion is called$q$ and q.options_json = $q$["Kinematics", "Dynamics", "Heat", "Motion"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$The rest and motion of an object is explained by which property$q$, options_json = $q$["Absolute", "Constant", "Variable", "Relative"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$The rest and motion of an object is explained by which property$q$ and q.options_json = $q$["Absolute", "Constant", "Variable", "Relative"]$q$::jsonb)
       or (q.stem_md = $q$The rest and motion of an object is explained by which property$q$ and q.options_json = $q$["Absolute", "Constant", "Variable", "Relative"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$When an object repeat its motion about a point again and again this motion is known as$q$, options_json = $q$["Translatory", "Rotatory", "Vibratory", "None of these"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$When an object repeat its motion about a point again and again this motion is known as$q$ and q.options_json = $q$["Translatory", "Rotatory", "Vibratory", "None of these"]$q$::jsonb)
       or (q.stem_md = $q$When an object repeat its motion about a point again and again this motion is known as$q$ and q.options_json = $q$["Translatory", "Rotatory", "Vibratory", "None of these"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which type of motion of earth causes day and night on earth$q$, options_json = $q$["Circular", "Rotatory", "Vibratory", "Random"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$Which type of motion of earth causes day and night on earth$q$ and q.options_json = $q$["Circular", "Rotatory", "Vibratory", "Random"]$q$::jsonb)
       or (q.stem_md = $q$Which type of motion of earth causes day and night on earth$q$ and q.options_json = $q$["Circular", "Rotatory", "Vibratory", "Random"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$What is the name for this symbol '∆'$q$, options_json = $q$["Vector", "Force", "Delta", "Rho"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$What is the name for this symbol '∆'$q$ and q.options_json = $q$["Vector", "Force", "Delta", "Rho"]$q$::jsonb)
       or (q.stem_md = $q$What is the name for this symbol '∆'$q$ and q.options_json = $q$["Vector", "Force", "Delta", "Rho"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Who is the fastest man on Earth$q$, options_json = $q$["Usain Bolt", "Josh Inglis", "Sangakkara", "JP Duminy"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$Who is the fastest man on Earth$q$ and q.options_json = $q$["Usain Bolt", "Josh Inglis", "Sangakkara", "JP Duminy"]$q$::jsonb)
       or (q.stem_md = $q$Who is the fastest man on Earth$q$ and q.options_json = $q$["Usain Bolt", "Josh Inglis", "Sangakkara", "JP Duminy"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which property has the fastest speed calculated on Earth$q$, options_json = $q$["Sound", "Current", "Light", "Water"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$Which property has the fastest speed calculated on Earth$q$ and q.options_json = $q$["Sound", "Current", "Light", "Water"]$q$::jsonb)
       or (q.stem_md = $q$Which property has the fastest speed calculated on Earth$q$ and q.options_json = $q$["Sound", "Current", "Light", "Water"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If you want to move with a speed of light which property should you remove$q$, options_json = $q$["Energy", "Mass", "Weight", "Charge"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If you want to move with a speed of light which property should you remove$q$ and q.options_json = $q$["Energy", "Mass", "Weight", "Charge"]$q$::jsonb)
       or (q.stem_md = $q$If you want to move with a speed of light which property should you remove$q$ and q.options_json = $q$["Energy", "Mass", "Weight", "Charge"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Who is the first scientist to measure the speed of any material is$q$, options_json = $q$["Einstein", "Galileo", "Newton", "Hertz"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$Who is the first scientist to measure the speed of any material is$q$ and q.options_json = $q$["Einstein", "Galileo", "Newton", "Hertz"]$q$::jsonb)
       or (q.stem_md = $q$Who is the first scientist to measure the speed of any material is$q$ and q.options_json = $q$["Einstein", "Galileo", "Newton", "Hertz"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If the distance time graph represent a parallel line along time Axis what information we get from this$q$, options_json = $q$["Uniform motion", "Rest", "Acceleration", "Speed"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If the distance time graph represent a parallel line along time Axis what information we get from this$q$ and q.options_json = $q$["Uniform motion", "Rest", "Acceleration", "Speed"]$q$::jsonb)
       or (q.stem_md = $q$If the distance time graph represent a parallel line along time Axis what information we get from this$q$ and q.options_json = $q$["Uniform motion", "Rest", "Acceleration", "Speed"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If this speed and direction of moving body does not change with time then it's velocity is said to be$q$, options_json = $q$["Uniform", "Contact", "Variable", "Zero"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If this speed and direction of moving body does not change with time then it's velocity is said to be$q$ and q.options_json = $q$["Uniform", "Contact", "Variable", "Zero"]$q$::jsonb)
       or (q.stem_md = $q$If this speed and direction of moving body does not change with time then it's velocity is said to be$q$ and q.options_json = $q$["Uniform", "Contact", "Variable", "Zero"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If the direction of motion of a body and acceleration are in same direction then acceleration will be$q$, options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If the direction of motion of a body and acceleration are in same direction then acceleration will be$q$ and q.options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb)
       or (q.stem_md = $q$If the direction of motion of a body and acceleration are in same direction then acceleration will be$q$ and q.options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If a body is thrown upward then it's final velocity will be$q$, options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If a body is thrown upward then it's final velocity will be$q$ and q.options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb)
       or (q.stem_md = $q$If a body is thrown upward then it's final velocity will be$q$ and q.options_json = $q$["Uniform", "Positive", "Negative", "Zero"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If an object is dropped from top of building and is freely falling so the value of g depends on$q$, options_json = $q$["Mass", "Speed", "Size", "Height"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If an object is dropped from top of building and is freely falling so the value of g depends on$q$ and q.options_json = $q$["Mass", "Speed", "Size", "Height"]$q$::jsonb)
       or (q.stem_md = $q$If an object is dropped from top of building and is freely falling so the value of g depends on$q$ and q.options_json = $q$["Mass", "Speed", "Size", "Height"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$When an object is moving with uniform changing speed then the slope of speed time graph determine the magnitude of$q$, options_json = $q$["Displacement", "Velocity", "Acceleration", "Momentum"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$When an object is moving with uniform changing speed then the slope of speed time graph determine the magnitude of$q$ and q.options_json = $q$["Displacement", "Velocity", "Acceleration", "Momentum"]$q$::jsonb)
       or (q.stem_md = $q$When an object is moving with uniform changing speed then the slope of speed time graph determine the magnitude of$q$ and q.options_json = $q$["Displacement", "Velocity", "Acceleration", "Momentum"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If an object is slowing down the acceleration will be$q$, options_json = $q$["Positive", "Negative", "Zero", "Constant"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If an object is slowing down the acceleration will be$q$ and q.options_json = $q$["Positive", "Negative", "Zero", "Constant"]$q$::jsonb)
       or (q.stem_md = $q$If an object is slowing down the acceleration will be$q$ and q.options_json = $q$["Positive", "Negative", "Zero", "Constant"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A delivery truck travels along a winding track of length 1200 m in 60 seconds. The straight-line distance from its starting warehouse to its destination is 600 m. What is its average speed?$q$, options_json = $q$["10 m/s", "20 m/s", "30 m/s", "5 m/s"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$A delivery truck travels along a winding track of length 1200 m in 60 seconds. The straight-line distance from its starting warehouse to its destination is 600 m. What is its average speed?$q$ and q.options_json = $q$["10 m/s", "20 m/s", "30 m/s", "5 m/s"]$q$::jsonb)
       or (q.stem_md = $q$A delivery truck travels along a winding track of length 1200 m in 60 seconds. The straight-line distance from its starting warehouse to its destination is 600 m. What is its average speed?$q$ and q.options_json = $q$["10 m/s", "20 m/s", "30 m/s", "5 m/s"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A sports car accelerates uniformly from 10 m/s to 30 m/s over a time interval of 5 seconds. What is the precise rate of change of its velocity?$q$, options_json = $q$["8 m/s²", "4 m/s²", "6 m/s²", "2 m/s²"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$A sports car accelerates uniformly from 10 m/s to 30 m/s over a time interval of 5 seconds. What is the precise rate of change of its velocity?$q$ and q.options_json = $q$["8 m/s²", "4 m/s²", "6 m/s²", "2 m/s²"]$q$::jsonb)
       or (q.stem_md = $q$A sports car accelerates uniformly from 10 m/s to 30 m/s over a time interval of 5 seconds. What is the precise rate of change of its velocity?$q$ and q.options_json = $q$["8 m/s²", "4 m/s²", "6 m/s²", "2 m/s²"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$When an object is dropped in a true vacuum environment near Earth’s surface, its downward acceleration is:$q$, options_json = $q$["Dependent on the object’s total surface area profile", "Directly proportional to the mass of the object", "Constant at approximately 9.8 m/s², regardless of mass values", "Progressively decreasing as the object gains velocity"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$When an object is dropped in a true vacuum environment near Earth’s surface, its downward acceleration is:$q$ and q.options_json = $q$["Dependent on the object’s total surface area profile", "Directly proportional to the mass of the object", "Constant at approximately 9.8 m/s², regardless of mass values", "Progressively decreasing as the object gains velocity"]$q$::jsonb)
       or (q.stem_md = $q$When an object is dropped in a true vacuum environment near Earth’s surface, its downward acceleration is:$q$ and q.options_json = $q$["Dependent on the object’s total surface area profile", "Directly proportional to the mass of the object", "Constant at approximately 9.8 m/s², regardless of mass values", "Progressively decreasing as the object gains velocity"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A particle starts from rest and achieves a velocity of 24 m/s in a span of 6 seconds along a linear track. What is its average acceleration?$q$, options_json = $q$["4 m/s²", "144 m/s²", "2 m/s²", "0.25 m/s²"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$A particle starts from rest and achieves a velocity of 24 m/s in a span of 6 seconds along a linear track. What is its average acceleration?$q$ and q.options_json = $q$["4 m/s²", "144 m/s²", "2 m/s²", "0.25 m/s²"]$q$::jsonb)
       or (q.stem_md = $q$A particle starts from rest and achieves a velocity of 24 m/s in a span of 6 seconds along a linear track. What is its average acceleration?$q$ and q.options_json = $q$["4 m/s²", "144 m/s²", "2 m/s²", "0.25 m/s²"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If a body covers equal distance in equal intervals of time, then the speed of the body is known as:$q$, options_json = $q$["Uniform", "Variable", "Non uniform", "All of these"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If a body covers equal distance in equal intervals of time, then the speed of the body is known as:$q$ and q.options_json = $q$["Uniform", "Variable", "Non uniform", "All of these"]$q$::jsonb)
       or (q.stem_md = $q$If a body covers equal distance in equal intervals of time, then the speed of the body is known as:$q$ and q.options_json = $q$["Uniform", "Variable", "Non uniform", "All of these"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If a satellite is moving in a circle with constant speed, its velocity will be:$q$, options_json = $q$["Uniform", "Constant", "Variable", "All of these"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$If a satellite is moving in a circle with constant speed, its velocity will be:$q$ and q.options_json = $q$["Uniform", "Constant", "Variable", "All of these"]$q$::jsonb)
       or (q.stem_md = $q$If a satellite is moving in a circle with constant speed, its velocity will be:$q$ and q.options_json = $q$["Uniform", "Constant", "Variable", "All of these"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A passenger train traveling eastward along a straight track begins to slow down as it approaches a station. The direction of the train's acceleration is:$q$, options_json = $q$["Toward the East", "Toward the West", "Vertically downward", "It has no direction because it is slowing down"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$A passenger train traveling eastward along a straight track begins to slow down as it approaches a station. The direction of the train's acceleration is:$q$ and q.options_json = $q$["Toward the East", "Toward the West", "Vertically downward", "It has no direction because it is slowing down"]$q$::jsonb)
       or (q.stem_md = $q$A passenger train traveling eastward along a straight track begins to slow down as it approaches a station. The direction of the train's acceleration is:$q$ and q.options_json = $q$["Toward the East", "Toward the West", "Vertically downward", "It has no direction because it is slowing down"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$An airplane is flying toward the Southeast when the pilot throttles back the engines, causing the plane to slow down. The direction of the aircraft's acceleration is toward the:$q$, options_json = $q$["Southeast", "Northwest", "Southwest", "Northeast"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 2 and q.source = 'bank'
     and ((q.stem_md = $q$An airplane is flying toward the Southeast when the pilot throttles back the engines, causing the plane to slow down. The direction of the aircraft's acceleration is toward the:$q$ and q.options_json = $q$["Southeast", "Northwest", "Southwest", "Northeast"]$q$::jsonb)
       or (q.stem_md = $q$An airplane is flying toward the Southeast when the pilot throttles back the engines, causing the plane to slow down. The direction of the aircraft's acceleration is toward the:$q$ and q.options_json = $q$["Southeast", "Northwest", "Southwest", "Northeast"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If two forces act along the same straight line but in opposite directions, the magnitude of their resultant is found by which operation?$q$, options_json = $q$["Addition", "Subtraction", "Multiplication", "Division"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If two forces act along the same straight line but in opposite directions, the magnitude of their resultant is found by which operation?$q$ and q.options_json = $q$["Addition", "Subtraction", "Multiplication", "Division"]$q$::jsonb)
       or (q.stem_md = $q$If two forces act along the same straight line but in opposite directions, the magnitude of their resultant is found by which operation?$q$ and q.options_json = $q$["Addition", "Subtraction", "Multiplication", "Division"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$When vectors act at a certain angle instead of being parallel, which method must be drawn to add them?$q$, options_json = $q$["Algebraic addition", "Head-to-tail rule", "Direct subtraction", "Simple linear scale"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$When vectors act at a certain angle instead of being parallel, which method must be drawn to add them?$q$ and q.options_json = $q$["Algebraic addition", "Head-to-tail rule", "Direct subtraction", "Simple linear scale"]$q$::jsonb)
       or (q.stem_md = $q$When vectors act at a certain angle instead of being parallel, which method must be drawn to add them?$q$ and q.options_json = $q$["Algebraic addition", "Head-to-tail rule", "Direct subtraction", "Simple linear scale"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If an object is moving in a straight line at a completely constant speed, what is the net external force acting on it?$q$, options_json = $q$["Max force", "Variable force", "Zero force", "Infinite force"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If an object is moving in a straight line at a completely constant speed, what is the net external force acting on it?$q$ and q.options_json = $q$["Max force", "Variable force", "Zero force", "Infinite force"]$q$::jsonb)
       or (q.stem_md = $q$If an object is moving in a straight line at a completely constant speed, what is the net external force acting on it?$q$ and q.options_json = $q$["Max force", "Variable force", "Zero force", "Infinite force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If you want to change the state of rest or uniform motion of any object, what type of force is required?$q$, options_json = $q$["Balanced force", "Unbalanced force", "Internal force", "Zero force"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If you want to change the state of rest or uniform motion of any object, what type of force is required?$q$ and q.options_json = $q$["Balanced force", "Unbalanced force", "Internal force", "Zero force"]$q$::jsonb)
       or (q.stem_md = $q$If you want to change the state of rest or uniform motion of any object, what type of force is required?$q$ and q.options_json = $q$["Balanced force", "Unbalanced force", "Internal force", "Zero force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Which physical quantity is the direct, fundamental measure of a body's inertia?$q$, options_json = $q$["Weight", "Speed", "Mass", "Volume"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Which physical quantity is the direct, fundamental measure of a body's inertia?$q$ and q.options_json = $q$["Weight", "Speed", "Mass", "Volume"]$q$::jsonb)
       or (q.stem_md = $q$Which physical quantity is the direct, fundamental measure of a body's inertia?$q$ and q.options_json = $q$["Weight", "Speed", "Mass", "Volume"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A net, completely unbalanced external force acts continuously on a macroscopic object. Which inherent property of this moving object will always undergo a change?$q$, options_json = $q$["Velocity", "Intrinsic mass", "Structural inertia", "Gravitational weight"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A net, completely unbalanced external force acts continuously on a macroscopic object. Which inherent property of this moving object will always undergo a change?$q$ and q.options_json = $q$["Velocity", "Intrinsic mass", "Structural inertia", "Gravitational weight"]$q$::jsonb)
       or (q.stem_md = $q$A net, completely unbalanced external force acts continuously on a macroscopic object. Which inherent property of this moving object will always undergo a change?$q$ and q.options_json = $q$["Velocity", "Intrinsic mass", "Structural inertia", "Gravitational weight"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$According to Newton's third law of motion, action and reaction forces always act on which bodies?$q$, options_json = $q$["The same body", "Different bodies", "Only heavy bodies", "Only moving bodies"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$According to Newton's third law of motion, action and reaction forces always act on which bodies?$q$ and q.options_json = $q$["The same body", "Different bodies", "Only heavy bodies", "Only moving bodies"]$q$::jsonb)
       or (q.stem_md = $q$According to Newton's third law of motion, action and reaction forces always act on which bodies?$q$ and q.options_json = $q$["The same body", "Different bodies", "Only heavy bodies", "Only moving bodies"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Why do action and reaction forces never cancel each other out during motion?$q$, options_json = $q$["They are unequal", "They act simultaneously", "They act on different objects", "They act along different lines"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Why do action and reaction forces never cancel each other out during motion?$q$ and q.options_json = $q$["They are unequal", "They act simultaneously", "They act on different objects", "They act along different lines"]$q$::jsonb)
       or (q.stem_md = $q$Why do action and reaction forces never cancel each other out during motion?$q$ and q.options_json = $q$["They are unequal", "They act simultaneously", "They act on different objects", "They act along different lines"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$What does the mathematical area under a Force-versus-Time graph directly represent?$q$, options_json = $q$["Acceleration", "Linear momentum", "Structural inertia", "Impulse"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$What does the mathematical area under a Force-versus-Time graph directly represent?$q$ and q.options_json = $q$["Acceleration", "Linear momentum", "Structural inertia", "Impulse"]$q$::jsonb)
       or (q.stem_md = $q$What does the mathematical area under a Force-versus-Time graph directly represent?$q$ and q.options_json = $q$["Acceleration", "Linear momentum", "Structural inertia", "Impulse"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If a system is strictly classified as an "isolated system," what must be the value of the net external force acting on it?$q$, options_json = $q$["Maximum", "Constant and positive", "Exactly zero", "Dynamically variable"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If a system is strictly classified as an "isolated system," what must be the value of the net external force acting on it?$q$ and q.options_json = $q$["Maximum", "Constant and positive", "Exactly zero", "Dynamically variable"]$q$::jsonb)
       or (q.stem_md = $q$If a system is strictly classified as an "isolated system," what must be the value of the net external force acting on it?$q$ and q.options_json = $q$["Maximum", "Constant and positive", "Exactly zero", "Dynamically variable"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$According to Newton's second law written in terms of momentum, the net force acting on an object equals what?$q$, options_json = $q$["Total momentum", "Rate of change of momentum", "Product of momentum and time", "Initial momentum value"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$According to Newton's second law written in terms of momentum, the net force acting on an object equals what?$q$ and q.options_json = $q$["Total momentum", "Rate of change of momentum", "Product of momentum and time", "Initial momentum value"]$q$::jsonb)
       or (q.stem_md = $q$According to Newton's second law written in terms of momentum, the net force acting on an object equals what?$q$ and q.options_json = $q$["Total momentum", "Rate of change of momentum", "Product of momentum and time", "Initial momentum value"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$What physical quantity is defined as the product of an object's intrinsic mass and its linear velocity vector?$q$, options_json = $q$["Force", "Impulse", "Inertia", "Momentum"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$What physical quantity is defined as the product of an object's intrinsic mass and its linear velocity vector?$q$ and q.options_json = $q$["Force", "Impulse", "Inertia", "Momentum"]$q$::jsonb)
       or (q.stem_md = $q$What physical quantity is defined as the product of an object's intrinsic mass and its linear velocity vector?$q$ and q.options_json = $q$["Force", "Impulse", "Inertia", "Momentum"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If a body's acceleration is observed to be exactly zero, what must be true about the forces acting on it?$q$, options_json = $q$["No forces exist", "Net force is zero", "Force is maximum", "Only gravity acts"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If a body's acceleration is observed to be exactly zero, what must be true about the forces acting on it?$q$ and q.options_json = $q$["No forces exist", "Net force is zero", "Force is maximum", "Only gravity acts"]$q$::jsonb)
       or (q.stem_md = $q$If a body's acceleration is observed to be exactly zero, what must be true about the forces acting on it?$q$ and q.options_json = $q$["No forces exist", "Net force is zero", "Force is maximum", "Only gravity acts"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Newton's laws of motion fail to provide accurate descriptions for objects moving at which speeds?$q$, options_json = $q$["Very low speeds", "Medium speeds", "Near speed of light", "Zero speed"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Newton's laws of motion fail to provide accurate descriptions for objects moving at which speeds?$q$ and q.options_json = $q$["Very low speeds", "Medium speeds", "Near speed of light", "Zero speed"]$q$::jsonb)
       or (q.stem_md = $q$Newton's laws of motion fail to provide accurate descriptions for objects moving at which speeds?$q$ and q.options_json = $q$["Very low speeds", "Medium speeds", "Near speed of light", "Zero speed"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$If an object is moved from Earth to the Moon, which of its properties remains completely constant?$q$, options_json = $q$["Weight", "Mass", "Gravity", "Size"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$If an object is moved from Earth to the Moon, which of its properties remains completely constant?$q$ and q.options_json = $q$["Weight", "Mass", "Gravity", "Size"]$q$::jsonb)
       or (q.stem_md = $q$If an object is moved from Earth to the Moon, which of its properties remains completely constant?$q$ and q.options_json = $q$["Weight", "Mass", "Gravity", "Size"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$What happens to the weight of an object if it is taken to a location where the gravitational field strength is zero?$q$, options_json = $q$["Remains same", "Becomes zero", "Doubled", "Minimally decreases"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$What happens to the weight of an object if it is taken to a location where the gravitational field strength is zero?$q$ and q.options_json = $q$["Remains same", "Becomes zero", "Doubled", "Minimally decreases"]$q$::jsonb)
       or (q.stem_md = $q$What happens to the weight of an object if it is taken to a location where the gravitational field strength is zero?$q$ and q.options_json = $q$["Remains same", "Becomes zero", "Doubled", "Minimally decreases"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Two interacting bodies form an isolated system. During a complex, multi-stage collision between them, what can be scientifically concluded about their individual linear momentums?$q$, options_json = $q$["Both change", "Both stay constant", "Only the lighter changes", "Both instantly become zero"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Two interacting bodies form an isolated system. During a complex, multi-stage collision between them, what can be scientifically concluded about their individual linear momentums?$q$ and q.options_json = $q$["Both change", "Both stay constant", "Only the lighter changes", "Both instantly become zero"]$q$::jsonb)
       or (q.stem_md = $q$Two interacting bodies form an isolated system. During a complex, multi-stage collision between them, what can be scientifically concluded about their individual linear momentums?$q$ and q.options_json = $q$["Both change", "Both stay constant", "Only the lighter changes", "Both instantly become zero"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A book is resting on a table. Which force prevents it from passing through the table?$q$, options_json = $q$["Frictional force", "Tension force", "Normal force", "Magnetic force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A book is resting on a table. Which force prevents it from passing through the table?$q$ and q.options_json = $q$["Frictional force", "Tension force", "Normal force", "Magnetic force"]$q$::jsonb)
       or (q.stem_md = $q$A book is resting on a table. Which force prevents it from passing through the table?$q$ and q.options_json = $q$["Frictional force", "Tension force", "Normal force", "Magnetic force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A person pulls a bucket upward using a rope. The force transmitted through the rope is:$q$, options_json = $q$["Normal force", "Elastic force", "Tension force", "Gravitational force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A person pulls a bucket upward using a rope. The force transmitted through the rope is:$q$ and q.options_json = $q$["Normal force", "Elastic force", "Tension force", "Gravitational force"]$q$::jsonb)
       or (q.stem_md = $q$A person pulls a bucket upward using a rope. The force transmitted through the rope is:$q$ and q.options_json = $q$["Normal force", "Elastic force", "Tension force", "Gravitational force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A cricketer catches a fast-moving ball by moving his hands backward. This reduces:$q$, options_json = $q$["Momentum", "Impulse", "Force of impact", "Mass"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A cricketer catches a fast-moving ball by moving his hands backward. This reduces:$q$ and q.options_json = $q$["Momentum", "Impulse", "Force of impact", "Mass"]$q$::jsonb)
       or (q.stem_md = $q$A cricketer catches a fast-moving ball by moving his hands backward. This reduces:$q$ and q.options_json = $q$["Momentum", "Impulse", "Force of impact", "Mass"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Two students push a box equally in opposite directions. The box remains at rest because:$q$, options_json = $q$["No force acts", "Resultant force is zero", "Friction is absent", "Weight becomes zero"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Two students push a box equally in opposite directions. The box remains at rest because:$q$ and q.options_json = $q$["No force acts", "Resultant force is zero", "Friction is absent", "Weight becomes zero"]$q$::jsonb)
       or (q.stem_md = $q$Two students push a box equally in opposite directions. The box remains at rest because:$q$ and q.options_json = $q$["No force acts", "Resultant force is zero", "Friction is absent", "Weight becomes zero"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A parachute slows a falling skydiver mainly because of:$q$, options_json = $q$["Tension", "Normal force", "Air resistance", "Magnetic force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A parachute slows a falling skydiver mainly because of:$q$ and q.options_json = $q$["Tension", "Normal force", "Air resistance", "Magnetic force"]$q$::jsonb)
       or (q.stem_md = $q$A parachute slows a falling skydiver mainly because of:$q$ and q.options_json = $q$["Tension", "Normal force", "Air resistance", "Magnetic force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$When a person walks, the forward motion is possible because of:$q$, options_json = $q$["Gravitational force", "Friction between foot and ground", "Tension", "Electrostatic force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$When a person walks, the forward motion is possible because of:$q$ and q.options_json = $q$["Gravitational force", "Friction between foot and ground", "Tension", "Electrostatic force"]$q$::jsonb)
       or (q.stem_md = $q$When a person walks, the forward motion is possible because of:$q$ and q.options_json = $q$["Gravitational force", "Friction between foot and ground", "Tension", "Electrostatic force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A magnet attracts an iron nail without touching it. This demonstrates:$q$, options_json = $q$["Contact force", "Elastic force", "Non-contact force", "Normal force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A magnet attracts an iron nail without touching it. This demonstrates:$q$ and q.options_json = $q$["Contact force", "Elastic force", "Non-contact force", "Normal force"]$q$::jsonb)
       or (q.stem_md = $q$A magnet attracts an iron nail without touching it. This demonstrates:$q$ and q.options_json = $q$["Contact force", "Elastic force", "Non-contact force", "Normal force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A truck and a bicycle have the same speed. Which has greater momentum?$q$, options_json = $q$["Bicycle", "Truck", "Same", "Cannot be determined"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A truck and a bicycle have the same speed. Which has greater momentum?$q$ and q.options_json = $q$["Bicycle", "Truck", "Same", "Cannot be determined"]$q$::jsonb)
       or (q.stem_md = $q$A truck and a bicycle have the same speed. Which has greater momentum?$q$ and q.options_json = $q$["Bicycle", "Truck", "Same", "Cannot be determined"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Why is it difficult to stop a loaded truck than an empty one moving at the same speed?$q$, options_json = $q$["Greater friction", "Greater momentum", "Smaller inertia", "Less force"]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Why is it difficult to stop a loaded truck than an empty one moving at the same speed?$q$ and q.options_json = $q$["Greater friction", "Greater momentum", "Smaller inertia", "Less force"]$q$::jsonb)
       or (q.stem_md = $q$Why is it difficult to stop a loaded truck than an empty one moving at the same speed?$q$ and q.options_json = $q$["Greater friction", "Greater momentum", "Smaller inertia", "Less force"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Passengers in a bus fall forward when brakes are applied because:$q$, options_json = $q$["Their bodies want to move forward.", "Their upper bodies continue moving due to inertia.", "Gravity increases suddenly.", "Friction becomes zero."]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Passengers in a bus fall forward when brakes are applied because:$q$ and q.options_json = $q$["Their bodies want to move forward.", "Their upper bodies continue moving due to inertia.", "Gravity increases suddenly.", "Friction becomes zero."]$q$::jsonb)
       or (q.stem_md = $q$Passengers in a bus fall forward when brakes are applied because:$q$ and q.options_json = $q$["Their bodies want to move forward.", "Their upper bodies continue moving due to inertia.", "Gravity increases suddenly.", "Friction becomes zero."]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$A gun recoils when a bullet is fired. Which statement best explains why the bullet moves much faster than the gun?$q$, options_json = $q$["Bullet experiences a larger force.", "Gun experiences a smaller force.", "Bullet has much smaller mass.", "Bullet has greater inertia."]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$A gun recoils when a bullet is fired. Which statement best explains why the bullet moves much faster than the gun?$q$ and q.options_json = $q$["Bullet experiences a larger force.", "Gun experiences a smaller force.", "Bullet has much smaller mass.", "Bullet has greater inertia."]$q$::jsonb)
       or (q.stem_md = $q$A gun recoils when a bullet is fired. Which statement best explains why the bullet moves much faster than the gun?$q$ and q.options_json = $q$["Bullet experiences a larger force.", "Gun experiences a smaller force.", "Bullet has much smaller mass.", "Bullet has greater inertia."]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Why are airbags installed in cars?$q$, options_json = $q$["They reduce momentum.", "They reduce mass.", "They increase collision time.", "They reduce inertia."]$q$::jsonb, category = 'scenario'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$Why are airbags installed in cars?$q$ and q.options_json = $q$["They reduce momentum.", "They reduce mass.", "They increase collision time.", "They reduce inertia."]$q$::jsonb)
       or (q.stem_md = $q$Why are airbags installed in cars?$q$ and q.options_json = $q$["They reduce momentum.", "They reduce mass.", "They increase collision time.", "They reduce inertia."]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$Newton's laws are not applicable to the motion of:$q$, options_json = $q$["Large-scale objects", "Small-scale objects", "Falling objects", "Moving vehicles"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$1 Newton's laws are not applicable to the motion of:$q$ and q.options_json = $q$["Large-scale objects", "Small-scale objects", "Falling objects", "Moving vehicles"]$q$::jsonb)
       or (q.stem_md = $q$Newton's laws are not applicable to the motion of:$q$ and q.options_json = $q$["Large-scale objects", "Small-scale objects", "Falling objects", "Moving vehicles"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  update questions q set stem_md = $q$According to Newton’s second law F=ma, a force of 1N is fundamentally equivalent to which combination of SI base units?$q$, options_json = $q$["1 kg⋅m/s", "1 kg⋅m/s²", "1 kg²⋅m/s", "1 m²⋅kg/s"]$q$::jsonb, category = 'concept'
    from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where q.chapter_id = c.id and s.name = 'Physics' and c.seq = 3 and q.source = 'bank'
     and ((q.stem_md = $q$According to Newton’s second law F=ma, a force of 1N is fundamentally equivalent to which combination of SI base units?$q$ and q.options_json = $q$["1kg⋅m/s", "1kg⋅m/s²", "1kg²⋅m/s", "1m²⋅kg/s"]$q$::jsonb)
       or (q.stem_md = $q$According to Newton’s second law F=ma, a force of 1N is fundamentally equivalent to which combination of SI base units?$q$ and q.options_json = $q$["1 kg⋅m/s", "1 kg⋅m/s²", "1 kg²⋅m/s", "1 m²⋅kg/s"]$q$::jsonb));
  get diagnostics k = row_count; n := n + k;
  raise notice 'physics bank fixes: % rows updated (84 expected)', n;
end $$;
