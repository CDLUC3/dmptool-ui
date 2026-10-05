"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

// Import modal components
import ConfirmModal from "@/components/Modal/ConfirmModal";
import { ModalOverlayComponent } from "@/components/ModalOverlayComponent";

import {
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
  SGTocGrid,
  SGTocSection,
} from "../../shared/components";
import "../../shared/styleguide.scss";

export default function ModalsPage() {
  // State for modal examples
  const [_showConfirmModal, _setShowConfirmModal] = React.useState(false);
  const [showOverlayModal, setShowOverlayModal] = React.useState(false);

  return (
    <LayoutContainer>
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/styleguide/components">Components</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Modals</span>
        </nav>

        <h1>Modal Components</h1>
        <p className="lead">
          Dialog overlays for user interactions, confirmations, and focused content display that requires attention.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Available Modals">
              <ul>
                <li>
                  <a href="#confirm-modal">Confirm Modal</a>
                </li>
                <li>
                  <a href="#modal-overlay">Modal Overlay</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Confirm Modal */}
        <section id="confirm-modal">
          <h2>Confirm Modal</h2>
          <p>Pre-built confirmation modal for email-related actions with localized text.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Email Confirmation Modal" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <ConfirmModal
                  title="Remove User Access"
                  email="user@example.com"
                  onConfirm={async (email) => {
                    console.log("Confirmed removal for:", email);
                  }}
                />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import ConfirmModal from '@/components/Modal/ConfirmModal';

<ConfirmModal
  title="Remove User Access"
  email="user@example.com"
  onConfirm={(email) => {
    handleRemoveUser(email);
  }}
/>`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>Built-in trigger button with localized &quot;Remove&quot; text</li>
                <li>Email-specific confirmation message</li>
                <li>Localized cancel and confirm buttons</li>
                <li>Automatic modal state management</li>
              </ul>

              <h4>Use Cases</h4>
              <ul>
                <li>Removing users from projects</li>
                <li>Revoking email access</li>
                <li>Template access management</li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Modal Overlay */}
        <section id="modal-overlay">
          <h2>Modal Overlay Component</h2>
          <p>Flexible overlay component for custom modal implementations and specialized use cases.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Custom Overlay Modal" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <button onClick={() => setShowOverlayModal(true)}>Open Custom Overlay</button>

                {showOverlayModal && (
                  <ModalOverlayComponent
                    isOpen={showOverlayModal}
                    heading="Custom Modal Example"
                    content="This modal uses the ModalOverlayComponent for complete control over the modal's appearance and behavior. It's useful when you need custom styling, specialized interaction patterns, or integration with other overlay systems."
                    btnSecondaryText="Cancel"
                    btnPrimaryText="Confirm"
                    onPressAction={(e, close) => {
                      console.log("Custom action confirmed");
                      close();
                    }}
                  />
                )}
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { ModalOverlayComponent } from '@/components/ModalOverlayComponent';

<ModalOverlayComponent
  isOpen={isOpen}
  heading="Modal Title"
  content="Modal content text"
  btnSecondaryText="Cancel"
  btnPrimaryText="Confirm"
  onPressAction={(e, close) => {
    // Handle action
    close();
  }}
/>`}</SGCodeBlock>

              <h4>Use Cases</h4>
              <ul>
                <li>Image galleries or lightboxes</li>
                <li>Multi-step wizards or forms</li>
                <li>Custom confirmation dialogs</li>
                <li>Specialized content viewers</li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
