"use client";

import React from "react";
import Markdown from "react-markdown";
import { useRouter } from "next/navigation";
import { useViewHash } from "@/hooks/useViewHash";

const t = `
### Problem
Cannot read data returned from REST API in browser if request is done with CORS violation.

# Impact
Prevents browsers from querying REST API.

### To reproduce
0. Run nwaku REST API
1. Copy https://github.com/waku-org/waku-frontend/tree/weboko/follow-up
5. Wait for 10 seconds and see in console following error:

It happens even though the request succeds. 


### Expected behavior
Error should not happen.

### Additional context
What happens is that browser implements Fetch API in the manner that when request is made to resource with CORS violation then even if it would succeed - client won't be able to read response data. 
Spec of the Fetch API - https://fetch.spec.whatwg.org/#concept-filtered-response-opaque


### The fix
Considering we expect REST API to be run only on localhost we should add following HTTP header to allow web apps run on different port to be able to talk to the API.
`;

const View = () => {
  const router = useRouter();
  const noteHash = useViewHash();

  React.useEffect(() => {
    if (!noteHash) {
      router.replace("/404");
    }
  }, [noteHash]);

  return <Markdown>{t}</Markdown>;
};

export default View;
