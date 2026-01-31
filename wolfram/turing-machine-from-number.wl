TuringMachineFromNumber[n_Integer, s_Integer : 2, k_Integer : 2] :=
 Catch[
  If[0 <= n <= (2 s k)^(s k) - 1, 
   Flatten[MapIndexed[{1, -1} #2 + {0, 
         k} -> {1, 1, 2} Mod[
          Quotient[#1, {2 k, 2, 1}], {s, k, 2}] + {1, 0, -1} &, 
     Partition[IntegerDigits[n, 2 s k, s k], k], {2}]],
   Throw[
    Failure["OutOfRange", <|
      "MessageTemplate" -> 
       "Enter a rule number in the range {0, `Max`}", 
      "MessageParameters" -> <|"Max" -> (2 s k)^(s k) - 1|>|>]]]]