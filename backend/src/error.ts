import Elysia from "elysia";
import { DataError } from "./types/errors";

export function error() {
    return (app: Elysia) => {
        return app
            .error({ DataError })
            .onError(({ set, code, error }) => {
                switch (code) {
                    case "DataError":
                        set.status =
                            (error.constructor as unknown as { status: number }).status || 400;
                        return new Response(JSON.stringify(error), {
                            headers: Object.assign(
                                { "content-type": "application/json" },
                                set.headers,
                            ),
                            status: set.status,
                        });
                    case "UNKNOWN":
                        set.status = 500;
                        // TODO: provide a unique id that is also logged with the error
                        return new Response(null, {
                            headers: set.headers,
                            status: set.status,
                        });
                }
            })
    }
}
