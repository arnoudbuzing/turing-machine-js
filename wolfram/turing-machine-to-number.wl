TuringMachineToNumber[
   rules : {(Rule | 
         RuleDelayed)[{_Integer, _Integer}, {_Integer, _Integer, _}] ..}] \
:= Catch[
   With[{states = Level[rules[[All, All, 1]], {2}], 
     colors = Level[rules[[All, All, 2]], {2}], 
     off = DeleteDuplicates[rules[[All, 2, 3]]]},
    If[! ContainsOnly[Map[Head, off], {Integer}], 
     Throw[Failure[
       "ListOffsets", <|
        "MessageTemplate" -> 
         "Turing machines with multidimensional offsets cannot be \
enumerated"|>]]];
    If[Length[Complement[off, {-1, 1}]] =!= 0, 
     Throw[Failure[
       "NonUnitOffsets", <|
        "MessageTemplate" -> 
         "Turing machines with non-unit offsets cannot be enumerated"|>]]];
    If[Min[states] < 1, 
     Throw[Failure[
       "InvalidStateSpecifications", <|
        "MessageTemplate" -> "Head states must be positive integers"|>]]];
    If[Min[colors] < 0, 
     Throw[Failure[
       "InvalidColorSpecifications", <|
        "MessageTemplate" -> 
         "Tape colors must be zero or a positive integer"|>]]];
    If[! DuplicateFreeQ[Map[First, rules]], 
     Throw[Failure[
       "OverspecifiedTuringMachine", <|
        "MessageTemplate" -> 
         "Enter rules that do not contain multiple transformations \
for a single input configuration"|>]]];
    If[Length[rules] =!= Max[states]*(Max[colors] + 1), 
     Throw[Failure[
       "UnderspecifiedTuringMachine", <|
        "MessageTemplate" -> 
         "Enter rules that contain a transformation for every \
possible input configuration"|>]]];
    {FromDigits[
      FromDigits[{# - 1, #2, (#3 + 1)/2}, 
         MixedRadix[{(Max[colors] + 1), 2}]] & @@@ 
       SortBy[rules, MapAt[-# &, #, {1, 2}] &][[All, 2]], 
      2 Max[states]*(Max[colors] + 1)], Max[states], (Max[colors] + 1)}]];