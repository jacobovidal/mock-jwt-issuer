export type BoundAccessToken = {
  /**
   * Confirmation claim that holds the JWK thumbprint.
   */
  cnf: {
    /**
     * JWK SHA-256 thumbprint of the key used in the DPoP proof.
     */
    jkt: string;
  };
};