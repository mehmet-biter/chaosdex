import * as qs from "query-string";
import * as React from "react";

import { Loading } from "@renex/react-components";
import { RouteComponentProps, withRouter } from "react-router";
import createPersistedState from "use-persisted-state";

import { _catchBackgroundErr_, _catchInteractionErr_ } from "../../lib/errors";
import { AppContainer, HistoryEvent } from "../../state/appContainer";
import { connect, ConnectedProps } from "../../state/connect";
import { Token } from "../../state/generalTypes";
import { NewOrder } from "../views/NewOrder";
import { OrderHistory } from "../views/OrderHistory";
import { OpeningOrder } from "./OpeningOrder";
import { PromptDetails } from "./PromptDetails";

const useOrderHistoryState = createPersistedState("order-history-v3");

interface StoredHistory {
    [outTx: string]: HistoryEvent;
}

/**
 * Exchange is the main token-swapping page.
 */
export const Exchange = withRouter(connect<RouteComponentProps & ConnectedProps<[AppContainer]>>([AppContainer])(
    ({ containers: [appContainer], location }) => {
        const [orderHistory, setOrderHistory] = useOrderHistoryState({} as unknown as StoredHistory);

        const cancel = () => {
            appContainer.setSubmitting(false).catch(_catchBackgroundErr_);
        };

        const swapSubmitted = (historyEvent: HistoryEvent) => {
            setOrderHistory((hist: StoredHistory) => {
                return {
                    ...hist,
                    [historyEvent.time]: historyEvent,
                };
            });
        };

        // useEffect replaces `componentDidMount` and `componentDidUpdate`.
        // To limit it to running once, we use the initialized hook.
        const [initialized, setInitialized] = React.useState(false);
        React.useEffect(() => {
            if (!initialized) {

                /*
                 * Set the URL based on the URL
                 * e.g. `URL?send=ETH&receive=DAI` will set the tokens to ETH
                 * and DAI.
                 */
                try {
                    const queryParams = qs.parse(location.search);
                    if (queryParams.send && queryParams.receive) {
                        appContainer.updateBothTokens(queryParams.send as Token, queryParams.receive as Token).catch(_catchInteractionErr_);
                    } else {
                        if (queryParams.send) {
                            appContainer.updateSrcToken(queryParams.send as Token).catch(_catchInteractionErr_);
                        }
                        if (queryParams.receive) {
                            appContainer.updateDstToken(queryParams.receive as Token).catch(_catchInteractionErr_);
                        }
                    }
                } catch (error) {
                    _catchInteractionErr_(error, {
                        description: "Error in Exchange.effect",
                        shownToUser: "No",
                    });
                }
                setInitialized(true);
            }
        }, [initialized, location.search, appContainer]);

        const orders = Object.values(orderHistory as StoredHistory).sort((a, b) => b.time - a.time);

        return <div className="exchange">
            <div className="content container exchange-inner">
                <div className="exchange--center">
                    <React.Suspense fallback={<Loading />}>
                        <NewOrder />
                        <OrderHistory orders={orders} pendingTXs={appContainer.state.pendingTXs} />
                        {appContainer.state.submitting ?
                            appContainer.state.refundAddress ?
                                <OpeningOrder cancel={cancel} swapSubmitted={swapSubmitted} />
                                : <PromptDetails cancel={cancel} />
                            : <></>
                        }
                    </React.Suspense>
                </div>
            </div>
        </div>;
    }
));
